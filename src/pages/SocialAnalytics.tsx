import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, Heart, Share2, MessageCircle, QrCode, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SocialInsights from '@/components/SocialInsights';

interface AnalyticsSummary {
  overview: {
    total_posts: number;
    total_views: number;
    total_likes: number;
    total_shares: number;
    total_comments: number;
    avg_engagement_rate: number;
    total_qr_scans: number;
    total_conversions: number;
    conversion_rate: number;
    total_revenue: number;
  };
  platform_breakdown: Record<string, {
    posts: number;
    views: number;
    engagement_rate: number;
  }>;
  top_posts: Array<{
    subclip_id: string;
    thumbnail_url: string;
    caption: string;
    views: number;
    engagement_rate: number;
    qr_scans: number;
    platforms: string[];
  }>;
  qr_performance: Record<string, {
    scans: number;
    conversions: number;
    revenue: number;
  }>;
}

export default function SocialAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    fetchArtistAndAnalytics();
  }, [user]);

  const fetchArtistAndAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get artist ID
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!artist) {
        console.log('No artist profile found');
        setLoading(false);
        return;
      }

      setArtistId(artist.id);

      // Fetch analytics summary
      const { data, error } = await supabase.functions.invoke('get-analytics-summary', {
        body: { artist_id: artist.id, days: 30 }
      });

      if (error) throw error;

      setSummary(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No analytics data available yet. Start publishing SubClips to see your performance!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const platformData = Object.entries(summary.platform_breakdown).map(([platform, data]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    views: data.views,
    posts: data.posts,
    engagement: data.engagement_rate.toFixed(2),
  }));

  const qrData = Object.entries(summary.qr_performance).map(([type, data]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    scans: data.scans,
    conversions: data.conversions,
    revenue: data.revenue,
  }));

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Social Analytics</h1>
        <p className="text-muted-foreground mt-2">Track your performance across all platforms</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overview.total_views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {summary.overview.total_posts} posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overview.avg_engagement_rate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.overview.total_likes + summary.overview.total_shares + summary.overview.total_comments} total interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overview.total_qr_scans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.overview.total_conversions} conversions ({summary.overview.conversion_rate.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.overview.total_revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">From QR conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {artistId && <SocialInsights artistId={artistId} summary={summary} />}

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="platforms">Platform Performance</TabsTrigger>
          <TabsTrigger value="top-posts">Top Posts</TabsTrigger>
          <TabsTrigger value="qr-analytics">QR Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--primary))" />
                  <Bar dataKey="posts" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-posts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summary.top_posts.map((post, idx) => (
              <Card key={post.subclip_id}>
                <CardContent className="p-4">
                  <div className="aspect-[9/16] relative mb-4 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                      #{idx + 1}
                    </div>
                  </div>
                  <p className="text-sm font-medium line-clamp-2 mb-3">{post.caption}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-semibold">{post.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="font-semibold">{post.engagement_rate.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">QR Scans</span>
                      <span className="font-semibold">{post.qr_scans}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qr-analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Performance by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={qrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scans" fill="hsl(var(--primary))" />
                  <Bar dataKey="conversions" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {qrData.map((item) => (
              <Card key={item.type}>
                <CardHeader>
                  <CardTitle>{item.type} QR Codes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scans</span>
                    <span className="font-semibold">{item.scans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversions</span>
                    <span className="font-semibold">{item.conversions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold">${item.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-semibold">
                      {item.scans > 0 ? ((item.conversions / item.scans) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
