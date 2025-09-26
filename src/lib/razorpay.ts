// Server-side Razorpay integration for Astro
const razorpayKey = import.meta.env.RAZORPAY_KEY_ID;
const razorpaySecret = import.meta.env.RAZORPAY_KEY_SECRET;

// Simple Razorpay API implementation without the full SDK
class SimpleRazorpay {
  private keyId: string;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  async createOrder(options: { amount: number; currency: string; notes?: any }) {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: options.currency,
        notes: options.notes || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const razorpay = razorpayKey && razorpaySecret
  ? new SimpleRazorpay(razorpayKey, razorpaySecret)
  : null;

// Pricing configuration in INR (paise - multiply by 100)
export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    displayPrice: '₹0',
    features: [
      '100 API calls/month',
      '10 requests/minute',
      'Community support',
      'Basic validation',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    priceMonthly: 239900, // ₹2,399 in paise
    priceYearly: 2499900, // ₹24,999 in paise
    displayPrice: '₹2,399/mo',
    displayPriceYearly: '₹24,999/yr',
    planIdMonthly: '', // Will be filled after creating in Razorpay
    planIdYearly: '',
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
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 819900, // ₹8,199 in paise
    priceYearly: 8199900, // ₹81,999 in paise
    displayPrice: '₹8,199/mo',
    displayPriceYearly: '₹81,999/yr',
    planIdMonthly: '', // Will be filled after creating in Razorpay
    planIdYearly: '',
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

// Create subscription checkout
export async function createSubscription(
  planId: string,
  customerId: string,
  email: string,
  name: string
) {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  // Create subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 12, // 12 months
    notes: {
      email: email,
      name: name,
      customer_id: customerId,
    },
  });

  return subscription;
}

// Create order for one-time payment
export async function createOrder(amount: number, userId: string) {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  const order = await razorpay.createOrder({
    amount: amount, // Amount in paise
    currency: 'INR',
    notes: {
      userId: userId,
    },
  });

  return order;
}

// Verify payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!razorpaySecret) {
    throw new Error('Razorpay secret not configured');
  }

  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

// Create customer
export async function createCustomer(email: string, name: string) {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  const customer = await razorpay.customers.create({
    email: email,
    name: name,
    notes: {
      created_via: 'safecaption',
    },
  });

  return customer;
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  const subscription = await razorpay.subscriptions.cancel(subscriptionId);
  return subscription;
}