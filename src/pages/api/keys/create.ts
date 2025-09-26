import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!supabase) {
    return new Response(JSON.stringify({
      error: 'Database not configured'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get auth token from cookie or header
  const token = cookies.get('sb-access-token')?.value ||
                request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { name } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({
        error: 'Key name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate a secure API key
    const apiKey = 'sk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store the API key
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key: apiKey,
        name: name,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({
        error: 'Failed to create API key'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      id: data.id,
      key: apiKey,
      name: data.name,
      created_at: data.created_at
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};