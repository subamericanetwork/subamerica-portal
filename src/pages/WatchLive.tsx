import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, Users, Share2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Hls from 'hls.js';
import { formatDistanceToNow } from 'date-fns';

interface StreamData {
  id: string;
  title: string;
  description: string | null;
  hls_playback_url: string | null;
  viewer_count: number;
  started_at: string | null;
  status: string;
  artist_id: string;
  artists: {
    display_name: string;
    slug: string;
    bio_short: string | null;
    brand: { avatar_url?: string } | null;
  };
}

export default function WatchLive() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) {
      navigate('/live');
      return;
    }

    fetchStreamData();
    
    // Subscribe to real-time updates for viewer count
    const channel = supabase
      .channel(`stream-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artist_live_streams',
          filter: `id=eq.${streamId}`
        },
        (payload) => {
          setStream(prev => prev ? { ...prev, ...payload.new } as StreamData : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamId, navigate]);

  useEffect(() => {
    if (stream?.hls_playback_url && videoRef.current) {
      initializePlayer();
    }
  }, [stream?.hls_playback_url]);

  const fetchStreamData = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_live_streams')
        .select(`
          id,
          title,
          description,
          hls_playback_url,
          viewer_count,
          started_at,
          status,
          artist_id,
          artists!inner(
            display_name,
            slug,
            bio_short,
            brand
          )
        `)
        .eq('id', streamId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError('Stream not found');
        return;
      }

      if (data.status !== 'live') {
        setError('This stream has ended');
        return;
      }

      setStream(data as StreamData);
    } catch (error) {
      console.error('Error fetching stream:', error);
      setError('Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

  const initializePlayer = () => {
    if (!videoRef.current || !stream?.hls_playback_url) return;

    const video = videoRef.current;

    // Check for native HLS support (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.hls_playback_url;
      video.play().catch(err => console.error('Playback error:', err));
    } else if (Hls.isSupported()) {
      // Use HLS.js for other browsers
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(stream.hls_playback_url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.error('Playback error:', err));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError('Stream playback error. Please refresh the page.');
              break;
          }
        }
      });
    } else {
      setError('Your browser does not support live streaming');
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream?.title || 'Live Stream',
          text: `Watch ${stream?.artists.display_name} live on Subamerica!`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied!',
        description: 'Stream link copied to clipboard',
      });
    }
  };

  const getAvatarUrl = () => {
    if (stream?.artists.brand && typeof stream.artists.brand === 'object' && 'avatar_url' in stream.artists.brand) {
      return stream.artists.brand.avatar_url as string;
    }
    return null;
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="w-full aspect-video mb-6" />
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </MemberLayout>
    );
  }

  if (error || !stream) {
    return (
      <MemberLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Card className="border-muted">
              <CardContent className="py-12 text-center">
                <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">{error || 'Stream Not Available'}</h3>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/live')}>
                    View Live Streams
                  </Button>
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/live')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Live Streams
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  autoPlay
                  playsInline
                />
                <Badge
                  variant="destructive"
                  className="absolute top-4 left-4 gap-1 animate-pulse"
                >
                  <Radio className="w-3 h-3" />
                  LIVE
                </Badge>
              </div>

              <Card className="border-muted">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getAvatarUrl() ? (
                        <img
                          src={getAvatarUrl()!}
                          alt={stream.artists.display_name}
                          className="w-12 h-12 rounded-full object-cover cursor-pointer"
                          onClick={() => navigate(`/${stream.artists.slug}`)}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer"
                          onClick={() => navigate(`/${stream.artists.slug}`)}
                        >
                          <span className="text-lg font-bold text-primary">
                            {stream.artists.display_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-2xl mb-1">{stream.title}</CardTitle>
                        <p
                          className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/${stream.artists.slug}`)}
                        >
                          {stream.artists.display_name}
                        </p>
                        {stream.started_at && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Started {formatDistanceToNow(new Date(stream.started_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  {stream.description && (
                    <CardDescription className="mt-4 text-base">
                      {stream.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="border-muted sticky top-20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Stream Info</CardTitle>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      {stream.viewer_count} watching
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">About {stream.artists.display_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stream.artists.bio_short || 'No bio available'}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/${stream.artists.slug}`)}
                  >
                    View Artist Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
