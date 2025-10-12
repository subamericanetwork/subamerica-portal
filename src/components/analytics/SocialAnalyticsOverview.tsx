import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, TrendingUp, Share2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SocialAnalyticsOverviewProps {
  totalImpressions: number;
  totalEngagement: number;
  avgEngagementRate: number;
  connectedPlatforms: number;
  posts?: any[];
}

export const SocialAnalyticsOverview = ({
  totalImpressions,
  totalEngagement,
  avgEngagementRate,
  connectedPlatforms,
  posts = [],
}: SocialAnalyticsOverviewProps) => {
  // Prepare trend data
  const trendData = posts
    .slice(0, 10)
    .reverse()
    .map((post) => ({
      date: new Date(post.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: post.social_analytics?.[0]?.impressions || 0,
      engagement: (post.social_analytics?.[0]?.likes || 0) + 
                  (post.social_analytics?.[0]?.comments || 0) + 
                  (post.social_analytics?.[0]?.shares || 0),
    }));

  // Platform comparison data
  const platformData = [
    {
      platform: 'Instagram',
      engagement: posts.filter(p => p.platform === 'instagram')
        .reduce((sum, p) => sum + ((p.social_analytics?.[0]?.likes || 0) + 
                                   (p.social_analytics?.[0]?.comments || 0)), 0),
    },
    {
      platform: 'Facebook',
      engagement: posts.filter(p => p.platform === 'facebook')
        .reduce((sum, p) => sum + ((p.social_analytics?.[0]?.likes || 0) + 
                                   (p.social_analytics?.[0]?.comments || 0)), 0),
    },
  ];

  const metrics = [
    {
      title: "Total Impressions",
      value: totalImpressions.toLocaleString(),
      icon: Eye,
      description: "Last 30 days",
    },
    {
      title: "Total Engagement",
      value: totalEngagement.toLocaleString(),
      icon: Heart,
      description: "Likes, comments, shares",
    },
    {
      title: "Avg. Engagement Rate",
      value: `${avgEngagementRate.toFixed(2)}%`,
      icon: TrendingUp,
      description: "Across all posts",
    },
    {
      title: "Connected Platforms",
      value: connectedPlatforms.toString(),
      icon: Share2,
      description: "Active connections",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {posts.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>Impressions and engagement over your recent posts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" name="Impressions" />
                  <Line type="monotone" dataKey="engagement" stroke="hsl(var(--chart-2))" name="Engagement" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Comparison</CardTitle>
              <CardDescription>Total engagement by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="engagement" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
