import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useArtistData } from "@/hooks/useArtistData";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Users, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StreamStats {
  totalStreams: number;
  totalWatchTime: number;
  avgViewers: number;
  peakViewers: number;
}

const StreamAnalytics = () => {
  const { artist, loading: artistLoading } = useArtistData();
  const [stats, setStats] = useState<StreamStats>({
    totalStreams: 0,
    totalWatchTime: 0,
    avgViewers: 0,
    peakViewers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (artist) {
      fetchStreamStats();
    }
  }, [artist]);

  const fetchStreamStats = async () => {
    if (!artist) return;

    try {
      const { data: streams, error } = await supabase
        .from('artist_live_streams')
        .select('*')
        .eq('artist_id', artist.id)
        .eq('status', 'ended');

      if (error) throw error;

      const totalStreams = streams?.length || 0;
      const totalWatchTime = streams?.reduce((sum, s) => sum + (s.total_watch_time_minutes || 0), 0) || 0;
      const totalViewers = streams?.reduce((sum, s) => sum + (s.viewer_count || 0), 0) || 0;
      const avgViewers = totalStreams > 0 ? Math.round(totalViewers / totalStreams) : 0;
      const peakViewers = streams?.reduce((max, s) => Math.max(max, s.peak_viewers || 0), 0) || 0;

      setStats({
        totalStreams,
        totalWatchTime,
        avgViewers,
        peakViewers
      });
    } catch (error) {
      console.error('Error fetching stream stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (artistLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!artist) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Artist profile not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stream Analytics</h1>
            <p className="text-muted-foreground">
              Track your streaming performance and audience engagement
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStreams}</div>
              <p className="text-xs text-muted-foreground">
                All completed streams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWatchTime}m</div>
              <p className="text-xs text-muted-foreground">
                Total minutes watched
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Viewers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgViewers}</div>
              <p className="text-xs text-muted-foreground">
                Per stream average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Viewers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.peakViewers}</div>
              <p className="text-xs text-muted-foreground">
                Highest concurrent viewers
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Streams</CardTitle>
            <CardDescription>
              Detailed analytics coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Individual stream analytics, viewer retention graphs, and engagement metrics will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StreamAnalytics;
