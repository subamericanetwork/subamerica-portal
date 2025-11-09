import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting social analytics sync...');

    // Get all published posts from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: posts, error: postsError } = await supabase
      .from('social_posts')
      .select(`
        id,
        artist_id,
        platform,
        external_id,
        status
      `)
      .eq('status', 'published')
      .gte('published_at', thirtyDaysAgo.toISOString());

    if (postsError) throw postsError;

    console.log(`Found ${posts?.length || 0} posts to sync`);

    let syncedCount = 0;
    const errors = [];

    for (const post of posts || []) {
      try {
        const metrics = await fetchPlatformMetrics(post.platform, post.external_id, post.artist_id, supabase);
        
        if (metrics) {
          await supabase
            .from('social_analytics')
            .upsert({
              social_post_id: post.id,
              platform: post.platform,
              views: metrics.views,
              likes: metrics.likes,
              shares: metrics.shares,
              comments: metrics.comments,
              engagement_rate: metrics.engagement_rate,
              last_synced: new Date().toISOString(),
            }, {
              onConflict: 'social_post_id,platform'
            });

          syncedCount++;
          console.log(`Synced ${post.platform} post ${post.external_id}`);
        }
      } catch (error) {
        console.error(`Error syncing post ${post.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ post_id: post.id, error: errorMessage });
      }
    }

    console.log(`Sync complete: ${syncedCount}/${posts?.length || 0} posts synced`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount, 
        total: posts?.length || 0,
        errors 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-social-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchPlatformMetrics(platform: string, externalId: string, artistId: string, supabase: any) {
  // Get auth token for artist
  const { data: auth } = await supabase
    .from('social_auth')
    .select('access_token')
    .eq('artist_id', artistId)
    .eq('platform', platform)
    .eq('is_active', true)
    .maybeSingle();

  if (!auth) {
    console.log(`No active auth for ${platform}, skipping`);
    return null;
  }

  try {
    switch (platform) {
      case 'tiktok':
        return await fetchTikTokMetrics(externalId, auth.access_token);
      case 'instagram':
        return await fetchInstagramMetrics(externalId, auth.access_token);
      case 'youtube':
        return await fetchYouTubeMetrics(externalId, auth.access_token);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${platform} metrics:`, error);
    return null;
  }
}

async function fetchTikTokMetrics(videoId: string, accessToken: string) {
  const response = await fetch(`https://open.tiktokapis.com/v2/video/query/?fields=view_count,like_count,share_count,comment_count`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filters: {
        video_ids: [videoId]
      }
    })
  });

  if (!response.ok) {
    throw new Error(`TikTok API error: ${response.status}`);
  }

  const data = await response.json();
  const video = data.data?.videos?.[0];

  if (!video) return null;

  const views = video.view_count || 0;
  const likes = video.like_count || 0;
  const shares = video.share_count || 0;
  const comments = video.comment_count || 0;

  return {
    views,
    likes,
    shares,
    comments,
    engagement_rate: views > 0 ? ((likes + shares + comments) / views * 100) : 0,
  };
}

async function fetchInstagramMetrics(mediaId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=reach,likes,shares,comments&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status}`);
  }

  const data = await response.json();
  const insights = data.data || [];

  const reach = insights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0;
  const likes = insights.find((i: any) => i.name === 'likes')?.values?.[0]?.value || 0;
  const shares = insights.find((i: any) => i.name === 'shares')?.values?.[0]?.value || 0;
  const comments = insights.find((i: any) => i.name === 'comments')?.values?.[0]?.value || 0;

  return {
    views: reach,
    likes,
    shares,
    comments,
    engagement_rate: reach > 0 ? ((likes + shares + comments) / reach * 100) : 0,
  };
}

async function fetchYouTubeMetrics(videoId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();
  const video = data.items?.[0];

  if (!video) return null;

  const stats = video.statistics;
  const views = parseInt(stats.viewCount || '0');
  const likes = parseInt(stats.likeCount || '0');
  const comments = parseInt(stats.commentCount || '0');

  return {
    views,
    likes,
    shares: 0, // YouTube API doesn't provide share count
    comments,
    engagement_rate: views > 0 ? ((likes + comments) / views * 100) : 0,
  };
}
