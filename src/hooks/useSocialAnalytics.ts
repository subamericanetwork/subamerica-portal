import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSocialAnalytics = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["social-analytics", artistId],
    queryFn: async () => {
      if (!artistId) throw new Error("Artist ID required");

      // Fetch connections
      const { data: connections, error: connectionsError } = await supabase
        .from("social_connections")
        .select("*")
        .eq("artist_id", artistId)
        .eq("is_active", true);

      if (connectionsError) throw connectionsError;

      // Fetch posts with analytics
      const { data: posts, error: postsError } = await supabase
        .from("social_posts")
        .select(`
          *,
          social_analytics (*)
        `)
        .eq("artist_id", artistId)
        .order("posted_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Calculate aggregate metrics
      const { data: analytics, error: analyticsError } = await supabase
        .from("social_analytics")
        .select("impressions, reach, likes, comments, shares, saves, engagement_rate")
        .eq("artist_id", artistId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (analyticsError) throw analyticsError;

      const totalImpressions = analytics?.reduce((sum, a) => sum + (a.impressions || 0), 0) || 0;
      const totalEngagement = analytics?.reduce((sum, a) => 
        sum + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0) || 0;
      const avgEngagementRate = analytics?.length 
        ? analytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / analytics.length 
        : 0;

      return {
        connections: connections || [],
        posts: posts || [],
        analytics: analytics || [],
        totalImpressions,
        totalEngagement,
        avgEngagementRate,
      };
    },
    enabled: !!artistId,
  });
};
