import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Authentication features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'past_due';
  stripe_customer_id?: string;
  api_calls_count: number;
  api_calls_limit: number;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key: string;
  name: string;
  created_at: string;
  last_used?: string;
  usage_count: number;
  is_active: boolean;
}

export interface UsageLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  status_code: number;
  response_time: number;
  created_at: string;
  ip_address?: string;
}