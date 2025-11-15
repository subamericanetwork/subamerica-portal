import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshToken(refreshToken: string) {
  const clientId = Deno.env.get('TIKTOK_CLIENT_ID');
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientId!,
      client_secret: clientSecret!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error('Failed to refresh token');
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get artist_id
    const { data: artist } = await supabaseClient
      .from('artists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!artist) throw new Error('Artist profile not found');

    // Get TikTok auth
    let { data: auth } = await supabaseClient
      .from('social_auth')
      .select('*')
      .eq('artist_id', artist.id)
      .eq('platform', 'tiktok')
      .eq('is_active', true)
      .single();

    if (!auth) throw new Error('TikTok account not connected');

    // Refresh token if expiring soon
    const expiresAt = new Date(auth.expires_at);
    if (expiresAt.getTime() - Date.now() < 3600000) {
      const newTokens = await refreshToken(auth.refresh_token);
      await supabaseClient
        .from('social_auth')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq('id', auth.id);
      auth.access_token = newTokens.access_token;
    }

    // Fetch videos from TikTok
    const videosResponse = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,video_description,duration,height,width,create_time,view_count,like_count,comment_count,share_count', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: 20,
      }),
    });

    const videosData = await videosResponse.json();

    if (!videosResponse.ok || videosData.error) {
      console.error('TikTok API error:', videosData);
      throw new Error(videosData.error?.message || 'Failed to fetch videos');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        videos: videosData.data?.videos || [],
        has_more: videosData.data?.has_more || false,
        cursor: videosData.data?.cursor
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fetch TikTok videos error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
