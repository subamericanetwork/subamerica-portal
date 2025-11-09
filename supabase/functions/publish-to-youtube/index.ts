import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshToken(refreshToken: string) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
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
    const { subclip_id, scheduled_post_id, caption, hashtags } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get SubClip
    const { data: subclip } = await supabaseClient
      .from('subclip_library')
      .select('*')
      .eq('id', subclip_id)
      .single();

    if (!subclip) throw new Error('SubClip not found');

    // Get auth
    let { data: auth } = await supabaseClient
      .from('social_auth')
      .select('*')
      .eq('artist_id', subclip.artist_id)
      .eq('platform', 'youtube')
      .eq('is_active', true)
      .single();

    if (!auth) throw new Error('YouTube account not connected');

    // Refresh token if expiring soon
    const expiresAt = new Date(auth.expires_at);
    if (expiresAt.getTime() - Date.now() < 3600000) {
      const newTokens = await refreshToken(auth.refresh_token);
      await supabaseClient
        .from('social_auth')
        .update({
          access_token: newTokens.access_token,
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

    // Prepare metadata
    const title = caption.substring(0, 100);
    const description = `${caption}\n\n#Shorts\n\n${hashtags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;

    const metadata = {
      snippet: {
        title,
        description,
        categoryId: '10', // Music category
        tags: hashtags,
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    // Initialize resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': videoBytes.length.toString(),
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify(metadata),
      }
    );

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) throw new Error('Failed to get upload URL');

    // Upload video
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: videoBytes,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok || uploadData.error) {
      throw new Error(uploadData.error?.message || 'Failed to upload video');
    }

    const videoId = uploadData.id;

    // Update scheduled post
    if (scheduled_post_id) {
      const { data: currentPost } = await supabaseClient
        .from('social_scheduled_posts')
        .select('external_ids')
        .eq('id', scheduled_post_id)
        .single();

      const externalIds = currentPost?.external_ids || {};
      externalIds.youtube = videoId;

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
        platform: 'youtube',
        external_id: videoId,
        caption,
        hashtags,
        status: 'published',
        published_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ success: true, video_id: videoId, url: `https://youtube.com/shorts/${videoId}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('YouTube publish error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
