import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, Users, Share2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StreamOverlayManager } from '@/components/overlays/StreamOverlayManager';
import Hls from 'hls.js';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
          console.log('🔄 Stream updated:', payload.new);
          const newData = payload.new as StreamData;
          
          // If stream ended or went to waiting, show error
          if (newData.status !== 'live' && stream?.status === 'live') {
            console.log('Stream has ended, showing error');
            setError('This stream has ended');
          }
          
          setStream(prev => prev ? { ...prev, ...newData } as StreamData : newData as StreamData);
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
      // First, sync stream status with Mux to ensure we have the latest data
      console.log('🔄 Syncing stream status with Mux...');
      await supabase.functions.invoke('sync-stream-status', {
        body: { streamId }
      });

      const { data, error } = await supabase
        .from('artist_live_streams')
        .select(`
          id,
          title,
          description,
          hls_playback_url,
          viewer_count,
          started_at,
          scheduled_start,
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

      console.log('📺 Stream data:', { status: data.status, hls_url: data.hls_playback_url });

      // Handle different stream statuses with clear messages
      if (data.status === 'ended' || data.status === 'cancelled') {
        setError('This stream has ended');
        setStream(data as StreamData);
        return;
      }
      
      if (data.status === 'waiting' || data.status === 'ready') {
        setError('This stream is not live yet. The broadcaster needs to start streaming.');
        setStream(data as StreamData);
        return;
      }
      
      if (data.status === 'scheduled') {
        const scheduledTime = data.scheduled_start ? new Date(data.scheduled_start) : null;
        const timeUntil = scheduledTime ? formatDistanceToNow(scheduledTime, { addSuffix: true }) : '';
        setError(`This stream is scheduled to start ${timeUntil}`);
        setStream(data as StreamData);
        return;
      }
      
      if (data.status !== 'live') {
        setError('This stream is not available');
        setStream(data as StreamData);
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
    const hlsUrl = stream.hls_playback_url;

    console.log('🎥 Initializing player with HLS URL:', hlsUrl);

    // Check for native HLS support (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('✅ Native HLS support detected');
      video.src = hlsUrl;
      video.play().catch(err => {
        console.error('❌ Error playing video:', err);
        if (err.name === 'NotAllowedError') {
          toast({
            title: 'Click to play',
            description: 'Your browser requires interaction to start playback',
          });
        } else {
          setError('Unable to play stream. Please refresh the page.');
        }
      });
    } else if (Hls.isSupported()) {
      console.log('✅ Using HLS.js for playback');
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed successfully');
        video.play().catch(err => {
          console.error('❌ Error playing video:', err);
          // Distinguish between autoplay errors and stream errors
          if (err.name === 'NotAllowedError') {
            toast({
              title: 'Click to play',
              description: 'Your browser requires interaction to start playback',
            });
          } else {
            setError('Unable to play stream. Please refresh the page.');
          }
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: hlsUrl
        });
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                console.log('❌ Manifest load error - stream may not be ready or has ended');
                // Re-check stream status
                fetchStreamData();
                setError('Waiting for the broadcast to begin...');
              } else {
                console.log('🔄 Network error, attempting recovery...');
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('💥 Fatal error, cannot recover');
              hls.destroy();
              setError('Stream connection lost. The stream may have ended.');
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      console.error('❌ HLS is not supported in this browser');
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
      <PublicLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-96 max-w-4xl w-full" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !stream) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-4 border-muted">
            <CardContent className="py-12 text-center">
              <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Stream Not Available</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'This stream is no longer available'}
              </p>
              <Button onClick={() => navigate('/live')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Live Streams
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        <div className={`container mx-auto ${isMobile ? 'px-3 py-4' : 'px-4 py-8'}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/live')}
            className={`${isMobile ? 'mb-3 min-h-[44px]' : 'mb-4'}`}
            size={isMobile ? "default" : "default"}
          >
            <ArrowLeft className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
            Back to Live Streams
          </Button>

          <div className={`grid grid-cols-1 lg:grid-cols-3 ${isMobile ? 'gap-4' : 'gap-6'}`}>
            <div className="lg:col-span-2">
              <div className={`relative bg-black rounded-lg overflow-hidden aspect-video ${isMobile ? 'mb-3' : 'mb-4'}`}>
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  autoPlay
                  playsInline
                />
                <StreamOverlayManager
                  streamId={stream.id}
                  videoElement={videoRef.current}
                  hlsInstance={hlsRef.current}
                  platform="web"
                />
                <Badge
                  variant="destructive"
                  className={`absolute ${isMobile ? 'top-2 left-2' : 'top-4 left-4'} gap-1 animate-pulse ${isMobile ? 'text-xs px-2 py-1' : ''}`}
                >
                  <Radio className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                  LIVE
                </Badge>
                
                {/* Debug overlay - shows stream status */}
                {process.env.NODE_ENV === 'development' && stream && (
                  <div className="absolute top-2 right-2 bg-black/90 text-white text-xs p-2 rounded font-mono max-w-xs">
                    <div><strong>ID:</strong> {stream.id.slice(0, 8)}...</div>
                    <div><strong>Status:</strong> {stream.status}</div>
                    <div><strong>HLS:</strong> {stream.hls_playback_url ? '✓' : '✗'}</div>
                    <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                  </div>
                )}
              </div>

              <Card className="border-muted">
                <CardHeader className={isMobile ? 'p-4' : ''}>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1">
                      {getAvatarUrl() ? (
                        <img
                          src={getAvatarUrl()!}
                          alt={stream.artists.display_name}
                          className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover cursor-pointer`}
                          onClick={() => navigate(`/${stream.artists.slug}`)}
                        />
                      ) : (
                        <div
                          className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-primary/20 flex items-center justify-center cursor-pointer`}
                          onClick={() => navigate(`/${stream.artists.slug}`)}
                        >
                          <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-primary`}>
                            {stream.artists.display_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`${isMobile ? 'text-lg' : 'text-2xl'} mb-1`}>{stream.title}</CardTitle>
                        <p
                          className={`text-muted-foreground cursor-pointer hover:text-primary transition-colors ${isMobile ? 'text-sm' : ''}`}
                          onClick={() => navigate(`/${stream.artists.slug}`)}
                        >
                          {stream.artists.display_name}
                        </p>
                        {stream.started_at && (
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                            Started {formatDistanceToNow(new Date(stream.started_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size={isMobile ? "default" : "sm"}
                      onClick={handleShare}
                      className={isMobile ? "shrink-0 px-3 min-h-[44px]" : ""}
                    >
                      <Share2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
                      {!isMobile && "Share"}
                    </Button>
                  </div>
                  {stream.description && (
                    <CardDescription className={`mt-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {stream.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className={`border-muted ${isMobile ? '' : 'sticky top-20'}`}>
                <CardHeader className={isMobile ? 'p-4' : ''}>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>Stream Info</CardTitle>
                    <Badge variant="secondary" className={`gap-1 ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
                      <Users className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                      {stream.viewer_count} {isMobile ? '' : 'watching'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-0' : ''}`}>
                  <div>
                    <h4 className={`font-semibold mb-2 ${isMobile ? 'text-sm' : ''}`}>About {stream.artists.display_name}</h4>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {stream.artists.bio_short || 'No bio available'}
                    </p>
                  </div>
                  <Button
                    className={`w-full ${isMobile ? 'min-h-[44px]' : ''}`}
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
    </PublicLayout>
  );
}
