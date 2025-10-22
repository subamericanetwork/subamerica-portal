import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoFeedItem } from './VideoFeedItem';
import { Loader2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  kind: string;
  video_url: string;
  thumb_url?: string;
  duration?: number;
  artist_id: string;
  artists?: {
    display_name: string;
    slug: string;
  };
}

interface VerticalVideoFeedProps {
  playlistId?: string;
  mode?: 'catalog' | 'playlist';
}

export const VerticalVideoFeed = ({ playlistId, mode = 'catalog' }: VerticalVideoFeedProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'playlist' && playlistId) {
        // Get videos from specific playlist
        const { data: playlist, error: playlistError } = await supabase
          .from('member_playlists')
          .select('video_ids')
          .eq('id', playlistId)
          .single();

        if (playlistError) throw playlistError;

        if (playlist?.video_ids && playlist.video_ids.length > 0) {
          const { data: videosData, error: videosError } = await supabase
            .from('videos')
            .select(`
              id,
              title,
              kind,
              video_url,
              thumb_url,
              duration,
              artist_id,
              artists!inner (
                display_name,
                slug
              )
            `)
            .in('id', playlist.video_ids)
            .eq('status', 'ready');

          if (videosError) throw videosError;

          // Maintain playlist order
          const orderedVideos = playlist.video_ids
            .map(id => videosData?.find(v => v.id === id))
            .filter((v): v is any => v !== undefined) as Video[];

          setVideos(orderedVideos);
        } else {
          setVideos([]);
        }
      } else {
        // Get all published videos from catalog
        const { data, error } = await supabase
          .from('videos')
          .select(`
            id,
            title,
            kind,
            video_url,
            thumb_url,
            duration,
            artist_id,
            artists!inner (
              display_name,
              slug,
              port_settings!inner (
                publish_status
              )
            )
          `)
          .eq('status', 'ready')
          .not('published_at', 'is', null)
          .eq('artists.port_settings.publish_status', 'published')
          .order('published_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setVideos((data as any[]) || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [playlistId, mode]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    observerRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              setActiveIndex(index);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [videos.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No videos available</p>
          <p className="text-sm mt-2">
            {mode === 'playlist' ? 'This playlist is empty' : 'No videos in the catalog yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .snap-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {videos.map((video, index) => (
        <div
          key={video.id}
          ref={(el) => (observerRefs.current[index] = el)}
          className="h-full w-full"
        >
          <VideoFeedItem video={video} isActive={activeIndex === index} />
        </div>
      ))}
    </div>
  );
};
