import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
  // Security headers
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Rate limiting configuration
const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute for auth
  api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute for API
  ai: { maxRequests: 20, windowMs: 60000 }, // 20 AI requests per minute
};

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

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    switch (action) {
      case 'check-rate-limit': {
        const { endpoint, identifier } = data;
        const rateConfig = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.api;
        
        const windowStart = new Date(Date.now() - rateConfig.windowMs).toISOString();
        const rateLimitKey = identifier || clientIp;

        // Check existing rate limit entries
        const { data: existingEntries, error: fetchError } = await supabase
          .from('rate_limits')
          .select('request_count')
          .eq('identifier', rateLimitKey)
          .eq('endpoint', endpoint)
          .gte('window_start', windowStart)
          .maybeSingle();

        if (fetchError) {
          console.error('Rate limit fetch error:', fetchError);
          // Fail open - allow request if we can't check rate limit
          return new Response(JSON.stringify({ allowed: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (existingEntries && existingEntries.request_count >= rateConfig.maxRequests) {
          console.log(`Rate limit exceeded for ${rateLimitKey} on ${endpoint}`);
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

        // Upsert rate limit entry using service role (bypasses RLS)
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
        const { email, ipAddress } = data;

        // Check for existing failed attempts
        const { data: existing } = await supabase
          .from('failed_login_attempts')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        // Check if account is locked
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
          // Lock for 15 minutes after 5 failed attempts
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
            .eq('email', email.toLowerCase());
        } else {
          await supabase
            .from('failed_login_attempts')
            .insert({
              email: email.toLowerCase(),
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
        const { email } = data;

        await supabase
          .from('failed_login_attempts')
          .delete()
          .eq('email', email.toLowerCase());

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'log-security-event': {
        const { userId, eventAction, resourceType, resourceId, metadata } = data;

        await supabase
          .from('security_audit_log')
          .insert({
            user_id: userId,
            action: eventAction,
            resource_type: resourceType,
            resource_id: resourceId,
            ip_address: clientIp,
            user_agent: req.headers.get('user-agent'),
            metadata,
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check-login-status': {
        const { email } = data;

        const { data: existing } = await supabase
          .from('failed_login_attempts')
          .select('locked_until, attempt_count')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
          return new Response(JSON.stringify({ 
            locked: true, 
            lockedUntil: existing.locked_until,
            attemptCount: existing.attempt_count,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          locked: false,
          attemptCount: existing?.attempt_count || 0,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
