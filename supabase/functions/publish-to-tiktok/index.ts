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
    const { subclip_id, scheduled_post_id, caption, hashtags, privacy_level = 'public' } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get SubClip
    const { data: subclip } = await supabaseClient
      .from('subclip_library')
      .select('*, artists(user_id)')
      .eq('id', subclip_id)
      .single();

    if (!subclip) throw new Error('SubClip not found');

    // Get auth
    let { data: auth } = await supabaseClient
      .from('social_auth')
      .select('*')
      .eq('artist_id', subclip.artist_id)
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

    // Download video
    const { data: videoBlob } = await supabaseClient.storage
      .from('social_clips')
      .download(subclip.clip_url.split('/social_clips/')[1]);

    if (!videoBlob) throw new Error('Failed to download video');

    const videoBytes = new Uint8Array(await videoBlob.arrayBuffer());

    // Initialize upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: privacy_level.toUpperCase(),
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoBytes.length,
          chunk_size: videoBytes.length,
          total_chunk_count: 1,
        },
      }),
    });

    const initData = await initResponse.json();
    if (!initResponse.ok || initData.error) {
      throw new Error(initData.error?.message || 'Failed to initialize upload');
    }

    const publishId = initData.data.publish_id;
    const uploadUrl = initData.data.upload_url;

    // Upload video
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${videoBytes.length - 1}/${videoBytes.length}`,
      },
      body: videoBytes,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video');
    }

    // Publish
    const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    const publishData = await publishResponse.json();

    // Update scheduled post
    if (scheduled_post_id) {
      const { data: currentPost } = await supabaseClient
        .from('social_scheduled_posts')
        .select('external_ids')
        .eq('id', scheduled_post_id)
        .single();

      const externalIds = currentPost?.external_ids || {};
      externalIds.tiktok = publishId;

      await supabaseClient
        .from('social_scheduled_posts')
        .update({
          external_ids: externalIds,
          status: 'published',
        })
        .eq('id', scheduled_post_id);
    }

    // Create social post record
    await supabaseClient
      .from('social_posts')
      .insert({
        artist_id: subclip.artist_id,
        subclip_id,
        scheduled_post_id,
        platform: 'tiktok',
        external_id: publishId,
        caption,
        hashtags,
        status: 'published',
        published_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ success: true, video_id: publishId, data: publishData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('TikTok publish error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
