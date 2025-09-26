import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { paymentId, orderId, signature, plan, billing } = await request.json();

    // Get user session from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!supabase) {
      return new Response(JSON.stringify({
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update user's subscription status
    const subscriptionTier = plan || 'pro';
    const newLimit = subscriptionTier === 'pro' ? 10000 : 100000;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: subscriptionTier,
        subscription_status: 'active',
        api_calls_limit: newLimit,
        api_calls_count: 0, // Reset usage for new subscription
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
      return new Response(JSON.stringify({
        error: 'Failed to update subscription'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Record the payment
    await supabase
      .from('payment_orders')
      .update({
        payment_id: paymentId,
        signature: signature,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment success handler error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process payment success'
    }), {
        status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};