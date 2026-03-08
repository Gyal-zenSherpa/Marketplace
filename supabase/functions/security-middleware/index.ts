import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Rate limiting configuration
const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60000 },
  api: { maxRequests: 100, windowMs: 60000 },
  ai: { maxRequests: 20, windowMs: 60000 },
};

// In-memory rate limiting for the endpoint itself to prevent abuse
const endpointRateLimit = new Map<string, { count: number; windowStart: number }>();
const ENDPOINT_RATE_LIMIT = { maxRequests: 10, windowMs: 60000 }; // 10 requests per minute per IP

function checkEndpointRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = endpointRateLimit.get(ip);
  
  if (!entry || now - entry.windowStart > ENDPOINT_RATE_LIMIT.windowMs) {
    endpointRateLimit.set(ip, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= ENDPOINT_RATE_LIMIT.maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * Verify JWT and return user ID. Returns null if invalid.
 */
async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;

  return data.claims.sub as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    // Rate limit the endpoint itself to prevent abuse
    if (!checkEndpointRateLimit(clientIp)) {
      return new Response(JSON.stringify({ 
        error: 'Too many requests to this endpoint. Please try again later.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }

    switch (action) {
      case 'check-rate-limit': {
        const { endpoint, identifier } = data;
        const rateConfig = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.api;
        
        const windowStart = new Date(Date.now() - rateConfig.windowMs).toISOString();
        const rateLimitKey = identifier || clientIp;

        const { data: existingEntries, error: fetchError } = await supabase
          .from('rate_limits')
          .select('request_count')
          .eq('identifier', rateLimitKey)
          .eq('endpoint', endpoint)
          .gte('window_start', windowStart)
          .maybeSingle();

        if (fetchError) {
          console.error('Rate limit fetch error:', fetchError);
          return new Response(JSON.stringify({ allowed: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (existingEntries && existingEntries.request_count >= rateConfig.maxRequests) {
          return new Response(JSON.stringify({ 
            allowed: false, 
            retryAfter: Math.ceil(rateConfig.windowMs / 1000),
            message: 'Too many requests. Please try again later.'
          }), {
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil(rateConfig.windowMs / 1000))
            },
          });
        }

        if (existingEntries) {
          try {
            await supabase
              .from('rate_limits')
              .update({ request_count: existingEntries.request_count + 1 })
              .eq('identifier', rateLimitKey)
              .eq('endpoint', endpoint);
          } catch (updateError) {
            console.error('Rate limit update error:', updateError);
          }
        } else {
          await supabase
            .from('rate_limits')
            .insert({
              identifier: rateLimitKey,
              endpoint,
              request_count: 1,
              window_start: new Date().toISOString(),
            });
        }

        return new Response(JSON.stringify({ allowed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'track-failed-login': {
        // Pre-auth action: validate that email is provided and use IP-based limiting
        // The endpoint-level rate limit above already prevents abuse
        const { email, ipAddress } = data;

        if (!email || typeof email !== 'string' || email.length > 255) {
          return new Response(JSON.stringify({ error: 'Invalid email' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sanitizedEmail = email.toLowerCase().trim();

        const { data: existing } = await supabase
          .from('failed_login_attempts')
          .select('*')
          .eq('email', sanitizedEmail)
          .maybeSingle();

        if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
          return new Response(JSON.stringify({ 
            locked: true, 
            lockedUntil: existing.locked_until,
            message: 'Account temporarily locked due to too many failed attempts.'
          }), {
            status: 423,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const newCount = (existing?.attempt_count || 0) + 1;
        const lockThreshold = 5;

        let lockedUntil = null;
        if (newCount >= lockThreshold) {
          lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }

        if (existing) {
          await supabase
            .from('failed_login_attempts')
            .update({
              attempt_count: newCount,
              last_attempt: new Date().toISOString(),
              ip_address: ipAddress || clientIp,
              locked_until: lockedUntil,
            })
            .eq('email', sanitizedEmail);
        } else {
          await supabase
            .from('failed_login_attempts')
            .insert({
              email: sanitizedEmail,
              ip_address: ipAddress || clientIp,
              attempt_count: 1,
            });
        }

        return new Response(JSON.stringify({ 
          attemptCount: newCount,
          locked: newCount >= lockThreshold,
          lockedUntil,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'reset-failed-logins': {
        // REQUIRES authentication — only the authenticated user can reset their own login attempts
        const userId = await verifyAuth(req);
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { email } = data;
        if (!email || typeof email !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid email' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify the authenticated user's email matches the reset request
        const userClient = createClient(
          SUPABASE_URL,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );
        const { data: userData } = await userClient.auth.getUser();
        
        if (!userData?.user?.email || userData.user.email.toLowerCase() !== email.toLowerCase().trim()) {
          return new Response(JSON.stringify({ error: 'Forbidden: email mismatch' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabase
          .from('failed_login_attempts')
          .delete()
          .eq('email', email.toLowerCase().trim());

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'log-security-event': {
        // REQUIRES authentication — only authenticated users can log events
        const userId = await verifyAuth(req);
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { eventAction, resourceType, resourceId, metadata } = data;

        // Validate inputs
        if (!eventAction || typeof eventAction !== 'string' || eventAction.length > 100) {
          return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabase
          .from('security_audit_log')
          .insert({
            user_id: userId, // Use verified user ID, not client-supplied
            action: eventAction,
            resource_type: resourceType?.slice(0, 100),
            resource_id: resourceId?.slice(0, 100),
            ip_address: clientIp,
            user_agent: req.headers.get('user-agent')?.slice(0, 500),
            metadata,
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check-login-status': {
        // Pre-auth action: uses endpoint-level rate limiting
        const { email } = data;

        if (!email || typeof email !== 'string' || email.length > 255) {
          return new Response(JSON.stringify({ error: 'Invalid email' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sanitizedEmail = email.toLowerCase().trim();

        const { data: existing } = await supabase
          .from('failed_login_attempts')
          .select('locked_until, attempt_count')
          .eq('email', sanitizedEmail)
          .maybeSingle();

        if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
          return new Response(JSON.stringify({ 
            locked: true, 
            lockedUntil: existing.locked_until,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          locked: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('Security middleware error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
