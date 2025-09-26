import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

// Pricing configuration (in INR for India)
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    priceId: '', // Will be filled after creating in Stripe
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'INR',
    features: [
      '100 API calls/month',
      '10 requests/minute',
      'Community support',
      'Basic validation',
    ],
  },
  pro: {
    name: 'Pro',
    priceId: '', // Will be filled after creating in Stripe
    priceMonthly: 2399, // ₹2,399/month
    priceYearly: 24999, // ₹24,999/year (2 months free)
    currency: 'INR',
    features: [
      '10,000 API calls/month',
      '60 requests/minute',
      'Email support',
      'Advanced validation',
      'Custom rules',
      'Analytics dashboard',
      'Priority processing',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: '', // Will be filled after creating in Stripe
    priceMonthly: 8199, // ₹8,199/month
    priceYearly: 81999, // ₹81,999/year (2 months free)
    currency: 'INR',
    features: [
      '100,000 API calls/month',
      'Unlimited requests/minute',
      'Priority support',
      'All features included',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom training',
    ],
  },
};

// Create Stripe checkout session
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'upi', 'netbanking'], // India payment methods
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    metadata: {
      userId: userId,
    },
    subscription_data: {
      metadata: {
        userId: userId,
      },
    },
    // Enable UPI and NetBanking for Indian customers
    payment_method_collection: 'if_required',
    currency: 'inr',
  });

  return session;
}

// Create billing portal session for subscription management
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Handle webhook events from Stripe
export async function handleStripeWebhook(
  body: string,
  signature: string,
  endpointSecret: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    );

    return event;
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}