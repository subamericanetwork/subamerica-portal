import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Share2, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import SchedulePostDialog from "@/components/SchedulePostDialog";

interface SocialAuth {
  platform: string;
  platform_username: string;
  is_active: boolean;
  expires_at: string;
}

interface ScheduledPost {
  id: string;
  caption: string;
  platforms: string[];
  scheduled_at: string;
  status: string;
  external_ids: any;
  error_messages: any;
  subclip_library: {
    clip_url: string;
    thumbnail_url: string;
  };
}

const platformConfig = {
  tiktok: { name: 'TikTok', color: 'bg-black text-white', icon: '🎵' },
  instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', icon: '📸' },
  youtube: { name: 'YouTube', color: 'bg-red-600 text-white', icon: '▶️' },
};

const SocialConsole = () => {
  const { user } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAuth[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubclip, setSelectedSubclip] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchArtistData();
    }

    // Listen for OAuth success
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth-success') {
        toast.success(`Connected to ${event.data.platform}!`);
        fetchConnectedAccounts();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const fetchArtistData = async () => {
    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (artist) {
        setArtistId(artist.id);
        await Promise.all([
          fetchConnectedAccounts(),
          fetchScheduledPosts(artist.id),
        ]);
      }
    } catch (error) {
      console.error('Error fetching artist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const { data } = await supabase
        .from('social_auth')
        .select('platform, platform_username, is_active, expires_at')
        .eq('is_active', true);

      setConnectedAccounts(data || []);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    }
  };

  const fetchScheduledPosts = async (id: string) => {
    try {
      const { data } = await supabase
        .from('social_scheduled_posts')
        .select(`
          *,
          subclip_library (clip_url, thumbnail_url)
        `)
        .eq('artist_id', id)
        .order('scheduled_at', { ascending: false });

      setScheduledPosts(data || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to connect social accounts');
        return;
      }

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-${platform}/authorize`;
      
      window.open(
        authUrl,
        `oauth-${platform}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error('Failed to initiate connection');
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await supabase
        .from('social_auth')
        .update({ is_active: false })
        .eq('platform', platform);

      toast.success(`Disconnected from ${platform}`);
      fetchConnectedAccounts();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      draft: { color: 'secondary', icon: Clock, label: 'Draft' },
      scheduled: { color: 'default', icon: Clock, label: 'Scheduled' },
      publishing: { color: 'default', icon: Clock, label: 'Publishing...' },
      published: { color: 'default', icon: CheckCircle, label: 'Published' },
      partial: { color: 'default', icon: AlertCircle, label: 'Partial' },
      failed: { color: 'destructive', icon: XCircle, label: 'Failed' },
    };

    const config = configs[status as keyof typeof configs] || configs.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.color as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Share2 className="h-8 w-8" />
          Social Console
        </h1>
        <p className="text-muted-foreground">
          Manage your social media connections and schedule content
        </p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(platformConfig).map(([platform, config]) => {
              const connected = connectedAccounts.find(a => a.platform === platform);
              
              return (
                <Card key={platform}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{config.icon}</span>
                      {config.name}
                    </CardTitle>
                    <CardDescription>
                      {connected ? (
                        <>
                          Connected as <strong>@{connected.platform_username}</strong>
                        </>
                      ) : (
                        'Not connected'
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {connected ? (
                      <div className="space-y-2">
                        <Badge variant="outline" className="w-full justify-center">
                          ✓ Active
                        </Badge>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleDisconnect(platform)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className={`w-full ${config.color}`}
                        onClick={() => handleConnect(platform)}
                      >
                        Connect {config.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No scheduled posts yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create SubClips and schedule them from the Videos page
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {scheduledPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={post.subclip_library?.thumbnail_url}
                        alt="SubClip"
                        className="w-24 h-32 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{post.caption}</p>
                        <div className="flex gap-2 mt-2">
                          {post.platforms.map(platform => (
                            <Badge key={platform} variant="outline">
                              {platformConfig[platform as keyof typeof platformConfig]?.icon}{' '}
                              {platformConfig[platform as keyof typeof platformConfig]?.name}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {new Date(post.scheduled_at).toLocaleString()}
                          </span>
                          {getStatusBadge(post.status)}
                        </div>
                        {post.external_ids && Object.keys(post.external_ids).length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Posted to: </span>
                            {Object.entries(post.external_ids).map(([platform, id]) => (
                              <Badge key={platform} variant="secondary" className="ml-1">
                                {platformConfig[platform as keyof typeof platformConfig]?.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedSubclip && (
        <SchedulePostDialog
          open={!!selectedSubclip}
          onOpenChange={(open) => !open && setSelectedSubclip(null)}
          subclipId={selectedSubclip.id}
          subclipUrl={selectedSubclip.clip_url}
          defaultCaption={selectedSubclip.caption}
          defaultHashtags={selectedSubclip.hashtags || []}
          artistId={artistId!}
          onScheduled={() => {
            setSelectedSubclip(null);
            fetchScheduledPosts(artistId!);
          }}
        />
      )}
    </div>
  );
};

export default SocialConsole;
