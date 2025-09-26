import { supabase } from './supabase';
import type { ApiKey, UsageLog } from './supabase';

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; keyData?: ApiKey; error?: string }> {
  if (!supabase) {
    return { valid: false, error: 'Database not configured' };
  }

  if (!apiKey) {
    return { valid: false, error: 'API key required' };
  }

  // Remove 'Bearer ' prefix if present
  const cleanKey = apiKey.replace('Bearer ', '').trim();

  // Check if key starts with our prefix
  if (!cleanKey.startsWith('sk_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    // Fetch API key from database
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*, profiles!inner(*)')
      .eq('key', cleanKey)
      .eq('is_active', true)
      .single();

    if (error || !keyData) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if user has exceeded their API limit
    const profile = keyData.profiles;
    if (profile.api_calls_count >= profile.api_calls_limit) {
      return { valid: false, error: 'API limit exceeded. Please upgrade your plan.' };
    }

    return { valid: true, keyData };
  } catch (err) {
    console.error('API key validation error:', err);
    return { valid: false, error: 'Failed to validate API key' };
  }
}

export async function trackUsage(
  apiKeyId: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  ipAddress?: string
): Promise<void> {
  if (!supabase) return;

  try {
    // Log the API usage
    await supabase
      .from('usage_logs')
      .insert({
        api_key_id: apiKeyId,
        endpoint,
        status_code: statusCode,
        response_time: responseTime,
        ip_address: ipAddress,
      });

    // Update API key usage count and last used
    await supabase
      .from('api_keys')
      .update({
        usage_count: supabase.raw('usage_count + 1'),
        last_used: new Date().toISOString(),
      })
      .eq('id', apiKeyId);

    // Update user's API call count
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', apiKeyId)
      .single();

    if (keyData) {
      await supabase
        .from('profiles')
        .update({
          api_calls_count: supabase.raw('api_calls_count + 1'),
        })
        .eq('id', keyData.user_id);
    }
  } catch (err) {
    console.error('Failed to track usage:', err);
  }
}

export async function checkRateLimit(apiKey: string): Promise<{ allowed: boolean; limit?: number; remaining?: number }> {
  if (!supabase) {
    return { allowed: true }; // Allow if database not configured
  }

  try {
    // Get user's subscription tier and rate limits
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('*, profiles!inner(subscription_tier)')
      .eq('key', apiKey)
      .single();

    if (!keyData) {
      return { allowed: false };
    }

    // Get rate limit based on tier
    const rateLimits = {
      free: { perMinute: 10, perHour: 100 },
      pro: { perMinute: 60, perHour: 1000 },
      enterprise: { perMinute: 1000, perHour: 10000 },
    };

    const tier = keyData.profiles.subscription_tier;
    const limits = rateLimits[tier] || rateLimits.free;

    // Check recent usage (last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentUsage, error } = await supabase
      .from('usage_logs')
      .select('id')
      .eq('api_key_id', keyData.id)
      .gte('created_at', oneMinuteAgo);

    if (error) {
      return { allowed: true }; // Allow on error
    }

    const usageCount = recentUsage?.length || 0;

    if (usageCount >= limits.perMinute) {
      return {
        allowed: false,
        limit: limits.perMinute,
        remaining: 0
      };
    }

    return {
      allowed: true,
      limit: limits.perMinute,
      remaining: limits.perMinute - usageCount
    };
  } catch (err) {
    console.error('Rate limit check error:', err);
    return { allowed: true }; // Allow on error
  }
}