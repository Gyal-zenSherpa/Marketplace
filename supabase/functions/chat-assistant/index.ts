import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // Try to get authenticated user (optional)
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      try {
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } }
        });
        const { data: { user } } = await authClient.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (e) {
        console.log('Auth check failed, continuing as anonymous');
      }
    }

    console.log('User context:', userId);

    const body = await req.json();
    
    // Validate messages input
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and validate messages
    const MAX_MESSAGES = 50;
    const MAX_CONTENT_LENGTH = 2000;
    const ALLOWED_ROLES = ['user', 'assistant'];

    const messages = body.messages
      .slice(-MAX_MESSAGES)
      .filter((msg: any) =>
        msg && typeof msg.role === 'string' && typeof msg.content === 'string' &&
        ALLOWED_ROLES.includes(msg.role)
      )
      .map((msg: any) => ({
        role: msg.role as string,
        content: msg.content.slice(0, MAX_CONTENT_LENGTH).trim(),
      }))
      .filter((msg: any) => msg.content.length > 0);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for fetching products
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch current products for context
    const { data: products } = await supabase
      .from('products')
      .select('name, brand, category, price, in_stock')
      .eq('in_stock', true)
      .limit(50);

    const productContext = products?.map(p => 
      `${p.name} by ${p.brand} (${p.category}) - $${p.price}`
    ).join('\n') || 'No products available';

    console.log('Chat request with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a friendly and helpful shopping assistant for our marketplace. You help customers find products, answer questions about our store, and provide shopping recommendations.

Current available products:
${productContext}

Guidelines:
- Be friendly, helpful, and concise
- Recommend specific products when relevant
- Help with product comparisons
- Answer questions about shipping, returns, and store policies
- If asked about something outside your scope, politely redirect to customer support
- Keep responses brief but helpful (2-4 sentences max)`
          },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error: unknown) {
    console.error('Error in chat assistant:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
