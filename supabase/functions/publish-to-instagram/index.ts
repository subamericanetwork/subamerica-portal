import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { data: auth } = await supabaseClient
      .from('social_auth')
      .select('*')
      .eq('artist_id', subclip.artist_id)
      .eq('platform', 'instagram')
      .eq('is_active', true)
      .single();

    if (!auth) throw new Error('Instagram account not connected');

    // Get public URL for video
    const { data: { publicUrl } } = supabaseClient.storage
      .from('social_clips')
      .getPublicUrl(subclip.clip_url.split('/social_clips/')[1]);

    const fullCaption = `${caption}\n\n${hashtags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;

    // Create container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${auth.platform_user_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: publicUrl,
          caption: fullCaption,
          share_to_feed: true,
          access_token: auth.access_token,
        }),
      }
    );

    const containerData = await containerResponse.json();
    if (!containerResponse.ok || containerData.error) {
      throw new Error(containerData.error?.message || 'Failed to create media container');
    }

    const creationId = containerData.id;

    // Poll for container status
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(
        `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${auth.access_token}`
      );
      const statusData = await statusResponse.json();
      status = statusData.status_code;
      attempts++;
    }

    if (status !== 'FINISHED') {
      throw new Error(`Video processing failed with status: ${status}`);
    }

    // Publish container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${auth.platform_user_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: auth.access_token,
        }),
      }
    );

    const publishData = await publishResponse.json();
    if (!publishResponse.ok || publishData.error) {
      throw new Error(publishData.error?.message || 'Failed to publish reel');
    }

    const mediaId = publishData.id;

    // Update scheduled post
    if (scheduled_post_id) {
      const { data: currentPost } = await supabaseClient
        .from('social_scheduled_posts')
        .select('external_ids')
        .eq('id', scheduled_post_id)
        .single();

      const externalIds = currentPost?.external_ids || {};
      externalIds.instagram = mediaId;

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
        platform: 'instagram',
        external_id: mediaId,
        caption,
        hashtags,
        status: 'published',
        published_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ success: true, media_id: mediaId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Instagram publish error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
