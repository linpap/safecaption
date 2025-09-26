import type { APIRoute } from 'astro';
import { createOrder } from '../../../lib/razorpay';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { plan, billing } = await request.json();

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

    // Calculate amount based on plan and billing cycle
    let amount = 0;
    let description = '';

    if (plan === 'pro') {
      amount = billing === 'yearly' ? 2499900 : 239900; // ₹24,999 or ₹2,399 in paise
      description = `SafeCaption Pro Plan - ${billing === 'yearly' ? 'Annual' : 'Monthly'}`;
    } else if (plan === 'enterprise') {
      amount = billing === 'yearly' ? 8199900 : 819900; // ₹81,999 or ₹8,199 in paise
      description = `SafeCaption Enterprise Plan - ${billing === 'yearly' ? 'Annual' : 'Monthly'}`;
    } else {
      return new Response(JSON.stringify({
        error: 'Invalid plan selected'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Razorpay order
    const order = await createOrder(amount, user.id);

    // Store order details in database for later verification
    await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: user.id,
        plan: plan,
        billing_cycle: billing,
        amount: amount,
        status: 'created',
      });

    return new Response(JSON.stringify({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      description: description,
      keyId: import.meta.env.RAZORPAY_KEY_ID
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create payment order'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};