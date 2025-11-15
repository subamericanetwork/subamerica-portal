import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  viewer_count: number;
  started_at: string | null;
  artist_id: string;
  artists: {
    display_name: string;
    slug: string;
    brand: any;
  };
}

export default function LiveStreams() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchLiveStreams();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('live-streams-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artist_live_streams',
          filter: 'status=eq.live'
        },
        () => {
          fetchLiveStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_live_streams')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          viewer_count,
          started_at,
          artist_id,
          artists!inner(
            display_name,
            slug,
            brand
          )
        `)
        .eq('status', 'live')
        .eq('show_on_web', true)
        .order('viewer_count', { ascending: false });

      if (error) throw error;
      setLiveStreams(data || []);
    } catch (error) {
      console.error('Error fetching live streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (stream: LiveStream) => {
    if (stream.artists.brand && typeof stream.artists.brand === 'object' && 'avatar_url' in stream.artists.brand) {
      return stream.artists.brand.avatar_url as string;
    }
    return null;
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-12 w-48 mb-2" />
              <Skeleton className="h-6 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        <div className={`container mx-auto ${isMobile ? 'px-3 py-6' : 'px-4 py-8'}`}>
          <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold mb-2 flex items-center gap-3`}>
              <Radio className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-destructive animate-pulse`} />
              Live Streams
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              Watch artists perform live right now
            </p>
          </div>

          {liveStreams.length === 0 ? (
            <Card className="border-muted">
              <CardContent className={`${isMobile ? 'py-10' : 'py-12'} text-center`}>
                <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
                <p className="text-muted-foreground mb-4">
                  There are no artists streaming right now. Check back soon!
                </p>
                <Button onClick={() => navigate('/portals')}>
                  Browse Artists
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${isMobile ? 'gap-4' : 'gap-6'}`}>
              {liveStreams.map((stream) => (
                <Card
                  key={stream.id}
                  className="border-muted hover:border-primary transition-all cursor-pointer group overflow-hidden"
                  onClick={() => navigate(`/live/${stream.id}`)}
                >
                  <div className="relative aspect-video bg-muted">
                    {stream.thumbnail_url ? (
                      <img
                        src={stream.thumbnail_url}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Radio className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      variant="destructive"
                      className="absolute top-3 left-3 gap-1 animate-pulse"
                    >
                      <Radio className="w-3 h-3" />
                      LIVE
                    </Badge>
                    {stream.viewer_count > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute top-3 right-3 gap-1 bg-background/80 backdrop-blur"
                      >
                        <Users className="w-3 h-3" />
                        {stream.viewer_count}
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {getAvatarUrl(stream) ? (
                        <img
                          src={getAvatarUrl(stream)!}
                          alt={stream.artists.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {stream.artists.display_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2 mb-1">
                          {stream.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {stream.artists.display_name}
                        </p>
                      </div>
                    </div>
                    {stream.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {stream.description}
                      </CardDescription>
                    )}
                    {stream.started_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        Started {formatDistanceToNow(new Date(stream.started_at), { addSuffix: true })}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
