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

    const url = new URL(req.url);
    const artistId = url.searchParams.get('artist_id');
    const days = parseInt(url.searchParams.get('days') || '30');

    if (!artistId) {
      throw new Error('artist_id is required');
    }

    console.log(`Fetching analytics summary for artist ${artistId}, last ${days} days`);

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Fetch published posts with analytics
    const { data: posts, error: postsError } = await supabase
      .from('social_posts')
      .select(`
        id,
        platform,
        external_id,
        published_at,
        subclip_library (
          id,
          thumbnail_url,
          caption,
          hashtags,
          qr_type
        ),
        social_analytics (
          views,
          likes,
          shares,
          comments,
          engagement_rate
        )
      `)
      .eq('artist_id', artistId)
      .eq('status', 'published')
      .gte('published_at', dateFrom.toISOString());

    if (postsError) throw postsError;

    // Fetch QR analytics
    const { data: qrData, error: qrError } = await supabase
      .from('qr_analytics')
      .select('qr_type, converted, conversion_value')
      .in('post_id', (posts || []).map(p => p.id));

    if (qrError) throw qrError;

    // Calculate overview metrics
    const overview = {
      total_posts: posts?.length || 0,
      total_views: 0,
      total_likes: 0,
      total_shares: 0,
      total_comments: 0,
      avg_engagement_rate: 0,
      total_qr_scans: qrData?.length || 0,
      total_conversions: qrData?.filter(q => q.converted).length || 0,
      conversion_rate: 0,
      total_revenue: 0,
    };

    posts?.forEach(post => {
      const analytics = post.social_analytics?.[0];
      if (analytics) {
        overview.total_views += analytics.views || 0;
        overview.total_likes += analytics.likes || 0;
        overview.total_shares += analytics.shares || 0;
        overview.total_comments += analytics.comments || 0;
      }
    });

    overview.avg_engagement_rate = posts?.length 
      ? posts.reduce((sum, p) => sum + (p.social_analytics?.[0]?.engagement_rate || 0), 0) / posts.length
      : 0;

    overview.conversion_rate = overview.total_qr_scans > 0
      ? (overview.total_conversions / overview.total_qr_scans) * 100
      : 0;

    overview.total_revenue = qrData?.reduce((sum, q) => sum + (q.conversion_value || 0), 0) || 0;

    // Calculate platform breakdown
    const platformBreakdown: any = {};
    posts?.forEach(post => {
      if (!platformBreakdown[post.platform]) {
        platformBreakdown[post.platform] = {
          posts: 0,
          views: 0,
          engagement_rate: 0,
        };
      }
      const analytics = post.social_analytics?.[0];
      platformBreakdown[post.platform].posts++;
      platformBreakdown[post.platform].views += analytics?.views || 0;
      platformBreakdown[post.platform].engagement_rate += analytics?.engagement_rate || 0;
    });

    Object.keys(platformBreakdown).forEach(platform => {
      platformBreakdown[platform].engagement_rate /= platformBreakdown[platform].posts;
    });

    // Get top posts
    const topPosts = posts
      ?.map(post => {
        const subclipData = Array.isArray(post.subclip_library) ? post.subclip_library[0] : post.subclip_library;
        const analyticsData = Array.isArray(post.social_analytics) ? post.social_analytics[0] : post.social_analytics;
        return {
          subclip_id: subclipData?.id,
          thumbnail_url: subclipData?.thumbnail_url,
          caption: subclipData?.caption,
          views: analyticsData?.views || 0,
          engagement_rate: analyticsData?.engagement_rate || 0,
          qr_scans: 0, // Will be calculated separately
          platforms: [post.platform],
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5) || [];

    // Calculate QR performance by type
    const qrPerformance: any = {};
    ['tip', 'ticket', 'content', 'merch'].forEach(type => {
      const typeData = qrData?.filter(q => q.qr_type === type) || [];
      qrPerformance[type] = {
        scans: typeData.length,
        conversions: typeData.filter(q => q.converted).length,
        revenue: typeData.reduce((sum, q) => sum + (q.conversion_value || 0), 0),
      };
    });

    const summary = {
      overview,
      platform_breakdown: platformBreakdown,
      top_posts: topPosts,
      qr_performance: qrPerformance,
    };

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-analytics-summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
