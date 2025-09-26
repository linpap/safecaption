import type { APIRoute } from 'astro';
import { createCheckoutSession, PRICING_PLANS } from '../../../lib/stripe';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { plan, priceId } = await request.json();

    // Get user session
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
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Stripe checkout session
    const successUrl = `${url.origin}/dashboard?success=true&plan=${plan}`;
    const cancelUrl = `${url.origin}/pricing?canceled=true`;

    const session = await createCheckoutSession(
      priceId,
      user.id,
      user.email!,
      successUrl,
      cancelUrl
    );

    return new Response(JSON.stringify({
      url: session.url,
      sessionId: session.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};