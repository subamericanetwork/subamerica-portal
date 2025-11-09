import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Target, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SocialInsightsProps {
  artistId: string;
  summary: any;
}

export default function SocialInsights({ artistId, summary }: SocialInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, [summary]);

  const generateInsights = async () => {
    try {
      setLoading(true);

      // Generate insights based on data
      const newInsights: string[] = [];

      // Platform performance insights
      const platforms = Object.entries(summary.platform_breakdown) as [string, any][];
      if (platforms.length > 0) {
        const bestPlatform = platforms.reduce((best, current) => 
          current[1].engagement_rate > best[1].engagement_rate ? current : best
        );
        newInsights.push(
          `${bestPlatform[0].charAt(0).toUpperCase() + bestPlatform[0].slice(1)} is your best performing platform with ${bestPlatform[1].engagement_rate.toFixed(2)}% engagement rate. Consider posting more content there.`
        );
      }

      // QR conversion insights
      const qrTypes = Object.entries(summary.qr_performance) as [string, any][];
      if (qrTypes.length > 0) {
        const bestQR = qrTypes.reduce((best, current) => 
          current[1].conversions > best[1].conversions ? current : best
        );
        if (bestQR[1].scans > 0) {
          const conversionRate = (bestQR[1].conversions / bestQR[1].scans * 100).toFixed(1);
          newInsights.push(
            `${bestQR[0].charAt(0).toUpperCase() + bestQR[0].slice(1)} QR codes have the highest conversion rate at ${conversionRate}%. Focus on this type for better monetization.`
          );
        }
      }

      // Engagement insights
      if (summary.overview.avg_engagement_rate > 0) {
        if (summary.overview.avg_engagement_rate > 5) {
          newInsights.push(
            `Excellent engagement rate of ${summary.overview.avg_engagement_rate.toFixed(2)}%! This is above industry average. Keep up the great content.`
          );
        } else {
          newInsights.push(
            `Your engagement rate is ${summary.overview.avg_engagement_rate.toFixed(2)}%. Try posting at different times or experimenting with different content styles to boost engagement.`
          );
        }
      }

      // Content recommendation
      if (summary.top_posts.length > 0) {
        const topPost = summary.top_posts[0];
        newInsights.push(
          `Your top performing post got ${topPost.views.toLocaleString()} views. Analyze what made it successful and create similar content.`
        );
      }

      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const icons = [TrendingUp, Target, Zap, Lightbulb];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
