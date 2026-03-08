import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId, pointsToRedeem } = await req.json();

    // Validate input
    if (!orderId || typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0 || !Number.isInteger(pointsToRedeem)) {
      return new Response(JSON.stringify({ error: 'Invalid input: orderId and positive integer pointsToRedeem required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the order belongs to this user and get total
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, total')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Order does not belong to user' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cap points to order total
    const maxRedeemable = Math.floor(order.total);
    const actualRedeem = Math.min(pointsToRedeem, maxRedeemable);

    // Fetch current loyalty balance
    const { data: loyalty, error: loyaltyError } = await supabaseAdmin
      .from('user_loyalty')
      .select('available_points, total_points')
      .eq('user_id', user.id)
      .single();

    if (loyaltyError || !loyalty) {
      return new Response(JSON.stringify({ error: 'Loyalty record not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (loyalty.available_points < actualRedeem) {
      return new Response(JSON.stringify({ error: 'Insufficient points balance' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Atomically deduct points (service role bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('user_loyalty')
      .update({
        available_points: loyalty.available_points - actualRedeem,
        total_points: loyalty.total_points - actualRedeem,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to deduct points:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to deduct points' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log points transaction
    await supabaseAdmin.from('points_transactions').insert({
      user_id: user.id,
      points: -actualRedeem,
      type: 'redeem',
      source: 'checkout',
      status: 'completed',
      description: `Redeemed ${actualRedeem} points on order ${orderId}`,
      reference_id: orderId,
    });

    return new Response(JSON.stringify({
      success: true,
      pointsRedeemed: actualRedeem,
      remainingPoints: loyalty.available_points - actualRedeem,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Redeem points error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
