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

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const { userPreferences, currentProductId, limit = 4 } = await req.json();

    // Use service role for fetching products
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch available products
    let query = supabase
      .from('products')
      .select('id, name, brand, category, price, description, image, rating')
      .eq('in_stock', true)
      .limit(20);

    // Only filter by currentProductId if it's a valid UUID
    if (currentProductId && currentProductId.length > 0) {
      query = query.neq('id', currentProductId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating recommendations based on:', userPreferences);

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
            content: 'You are a product recommendation AI. Based on user preferences, select the most relevant products. Return ONLY a JSON array of product IDs in order of relevance. Example: ["id1", "id2", "id3"]'
          },
          {
            role: 'user',
            content: `User preferences: ${userPreferences || 'general shopping'}

Available products:
${products.map(p => `ID: ${p.id}, Name: ${p.name}, Brand: ${p.brand}, Category: ${p.category}, Price: $${p.price}`).join('\n')}

Select the top ${limit} most relevant products for this user. Return only the JSON array of IDs.`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      // Fallback: return random products
      const shuffled = products.sort(() => 0.5 - Math.random());
      return new Response(JSON.stringify({ recommendations: shuffled.slice(0, limit) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '[]';
    
    console.log('AI response:', aiResponse);

    // Parse the AI response to get product IDs
    let recommendedIds: string[] = [];
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      recommendedIds = JSON.parse(cleanedResponse);
    } catch {
      console.log('Failed to parse AI response, using fallback');
      const shuffled = products.sort(() => 0.5 - Math.random());
      return new Response(JSON.stringify({ recommendations: shuffled.slice(0, limit) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the recommended products in order
    const recommendations = recommendedIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, limit);

    console.log('Returning recommendations:', recommendations.length);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error generating recommendations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
