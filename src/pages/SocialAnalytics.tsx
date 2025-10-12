import { useAuth } from "@/contexts/AuthContext";
import { useArtistData } from "@/hooks/useArtistData";
import { useSocialAnalytics } from "@/hooks/useSocialAnalytics";
import { useSocialConnection } from "@/hooks/useSocialConnection";
import { SocialConnectionCard } from "@/components/analytics/SocialConnectionCard";
import { SocialAnalyticsOverview } from "@/components/analytics/SocialAnalyticsOverview";
import { SocialPostsGrid } from "@/components/analytics/SocialPostsGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SocialAnalytics = () => {
  const { user } = useAuth();
  const { artist, loading: artistLoading } = useArtistData();
  const { data: analytics, isLoading: analyticsLoading } = useSocialAnalytics(artist?.id);
  const { initiateConnection, disconnect, syncNow, isDisconnecting, isSyncing } = useSocialConnection();

  const instagramConnection = analytics?.connections.find(c => c.platform === 'instagram');
  const facebookConnection = analytics?.connections.find(c => c.platform === 'facebook');

  if (artistLoading || analyticsLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Social Media Analytics</h1>
        <p className="text-muted-foreground">
          Connect and track your Instagram and Facebook performance
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SocialConnectionCard
            platform="instagram"
            isConnected={!!instagramConnection}
            username={instagramConnection?.platform_username || undefined}
            lastSynced={instagramConnection?.last_synced_at || undefined}
            onConnect={() => initiateConnection('instagram')}
            onDisconnect={instagramConnection ? () => disconnect(instagramConnection.id) : undefined}
            onSync={instagramConnection && artist?.id 
              ? () => syncNow({ platform: 'instagram', artistId: artist.id })
              : undefined}
            isDisconnecting={isDisconnecting}
            isSyncing={isSyncing}
          />
          <SocialConnectionCard
            platform="facebook"
            isConnected={!!facebookConnection}
            username={facebookConnection?.platform_username || undefined}
            lastSynced={facebookConnection?.last_synced_at || undefined}
            onConnect={() => initiateConnection('facebook')}
            onDisconnect={facebookConnection ? () => disconnect(facebookConnection.id) : undefined}
            onSync={facebookConnection && artist?.id
              ? () => syncNow({ platform: 'facebook', artistId: artist.id })
              : undefined}
            isDisconnecting={isDisconnecting}
            isSyncing={isSyncing}
          />
        </div>
      </div>

      {analytics?.connections.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Connect your first social media account to start tracking your analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once you connect Instagram or Facebook, you'll see detailed analytics including:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Post impressions and reach</li>
              <li>Engagement metrics (likes, comments, shares)</li>
              <li>Engagement rate trends over time</li>
              <li>Platform performance comparison</li>
              <li>Individual post analytics</li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
            <SocialAnalyticsOverview
              totalImpressions={analytics?.totalImpressions || 0}
              totalEngagement={analytics?.totalEngagement || 0}
              avgEngagementRate={analytics?.avgEngagementRate || 0}
              connectedPlatforms={analytics?.connections.length || 0}
              posts={analytics?.posts}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
            <SocialPostsGrid posts={analytics?.posts || []} />
          </div>
        </>
      )}
    </div>
  );
};

export default SocialAnalytics;
