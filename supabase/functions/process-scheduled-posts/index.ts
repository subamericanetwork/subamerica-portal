import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (_req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get posts scheduled for now or earlier
    const { data: scheduledPosts } = await supabaseClient
      .from('social_scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(JSON.stringify({ message: 'No posts to process' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${scheduledPosts.length} scheduled posts`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    for (const post of scheduledPosts) {
      try {
        // Update status to publishing
        await supabaseClient
          .from('social_scheduled_posts')
          .update({ status: 'publishing' })
          .eq('id', post.id);

        const platforms = post.platforms || [];
        const publishResults: { [key: string]: boolean } = {};
        const externalIds: { [key: string]: string } = {};

        // Publish to each platform
        for (const platform of platforms) {
          try {
            let functionName = '';
            if (platform === 'tiktok') functionName = 'publish-to-tiktok';
            else if (platform === 'instagram') functionName = 'publish-to-instagram';
            else if (platform === 'youtube') functionName = 'publish-to-youtube';

            if (!functionName) {
              console.error(`Unknown platform: ${platform}`);
              publishResults[platform] = false;
              continue;
            }

            const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subclip_id: post.subclip_id,
                scheduled_post_id: post.id,
                caption: post.caption,
                hashtags: post.hashtags,
                privacy_level: platform === 'tiktok' ? 'public' : undefined,
              }),
            });

            const result = await response.json();
            publishResults[platform] = result.success === true;

            if (result.success) {
              externalIds[platform] = result.video_id || result.media_id;
              console.log(`Published to ${platform}: ${externalIds[platform]}`);
            } else {
              console.error(`Failed to publish to ${platform}:`, result.error);
            }

          } catch (platformError) {
            console.error(`Error publishing to ${platform}:`, platformError);
            publishResults[platform] = false;
          }
        }

        // Determine final status
        const successCount = Object.values(publishResults).filter(Boolean).length;
        const totalCount = platforms.length;

        let finalStatus: string;
        if (successCount === 0) {
          finalStatus = 'failed';
        } else if (successCount === totalCount) {
          finalStatus = 'published';
        } else {
          finalStatus = 'partial';
        }

        // Update post with results
        await supabaseClient
          .from('social_scheduled_posts')
          .update({
            status: finalStatus,
            external_ids: externalIds,
            error_messages: publishResults,
          })
          .eq('id', post.id);

        console.log(`Post ${post.id} status: ${finalStatus}`);

      } catch (postError) {
        console.error(`Failed to process post ${post.id}:`, postError);
        const errorMessage = postError instanceof Error ? postError.message : 'Unknown error';
        
        await supabaseClient
          .from('social_scheduled_posts')
          .update({
            status: 'failed',
            error_messages: { error: errorMessage },
          })
          .eq('id', post.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: scheduledPosts.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduled posts processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
