import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Radio, Users, Clock, StopCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  viewer_count: number;
  started_at: string | null;
  artist_id: string;
  user_id: string;
  artists: {
    display_name: string;
    slug: string;
    brand: any;
    user_id: string;
  };
}

export default function LiveStreams() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [endingStreamId, setEndingStreamId] = useState<string | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

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
          user_id,
          artists!inner(
            display_name,
            slug,
            brand,
            user_id
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

  const handleEndStreamClick = (streamId: string) => {
    setSelectedStreamId(streamId);
    setShowEndDialog(true);
  };

  const handleEndStream = async () => {
    if (!selectedStreamId) return;

    setEndingStreamId(selectedStreamId);
    setShowEndDialog(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to end a stream');
        return;
      }

      const { data, error } = await supabase.functions.invoke('end-mux-stream', {
        body: { streamId: selectedStreamId },
      });

      if (error) throw error;

      toast.success('Stream ended successfully');
      
      // Refresh the list
      await fetchLiveStreams();
    } catch (error) {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
    } finally {
      setEndingStreamId(null);
      setSelectedStreamId(null);
    }
  };

  const getAvatarUrl = (stream: LiveStream) => {
    if (stream.artists.brand && typeof stream.artists.brand === 'object' && 'avatar_url' in stream.artists.brand) {
      return stream.artists.brand.avatar_url as string;
    }
    return null;
  };

  const Layout = user ? MemberLayout : UniversalLayout;

  if (loading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
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
              {liveStreams.map((stream) => {
                const isOwner = currentUser && stream.user_id === currentUser.id;
                
                return (
                  <Card
                    key={stream.id}
                    className="border-muted hover:border-primary transition-all group overflow-hidden relative"
                  >
                    {isOwner && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute bottom-3 right-3 z-10 gap-1 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndStreamClick(stream.id);
                        }}
                        disabled={endingStreamId === stream.id}
                      >
                        <StopCircle className="w-4 h-4" />
                        {endingStreamId === stream.id ? 'Ending...' : 'End Stream'}
                      </Button>
                    )}
                    <div 
                      className="cursor-pointer"
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
                            className="absolute bottom-3 right-3 gap-1 bg-background/80 backdrop-blur"
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
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Live Stream?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop your live stream and disconnect OBS. Viewers will no longer be able to watch. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEndStream}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                End Stream
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
