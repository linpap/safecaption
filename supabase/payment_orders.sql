-- Add payment orders table for tracking Razorpay payments
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  signature TEXT,
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  metadata JSONB
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- Enable RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own payment orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payment orders" ON public.payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);