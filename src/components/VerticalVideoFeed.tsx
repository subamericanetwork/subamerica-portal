import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoFeedItem } from './VideoFeedItem';
import { Loader2 } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  kind: string;
  video_url?: string;
  audio_url?: string;
  thumb_url?: string;
  duration?: number;
  artist_id: string;
  content_type: 'video' | 'audio';
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
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const allContent: ContentItem[] = [];

      if (mode === 'playlist' && playlistId) {
        // Get content from specific playlist
        const { data: playlist, error: playlistError } = await supabase
          .from('member_playlists')
          .select('video_ids, audio_ids')
          .eq('id', playlistId)
          .single();

        if (playlistError) throw playlistError;

        // Fetch videos
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
              artists!fk_videos_artist (
                display_name,
                slug
              )
            `)
            .in('id', playlist.video_ids)
            .eq('status', 'ready');

          if (videosError) throw videosError;

          const videos = videosData?.map(v => ({
            ...v,
            content_type: 'video' as const
          })) || [];

          allContent.push(...videos);
        }

        // Fetch audio tracks
        if (playlist?.audio_ids && playlist.audio_ids.length > 0) {
          const { data: audioData, error: audioError } = await supabase
            .from('audio_tracks')
            .select(`
              id,
              title,
              audio_url,
              thumb_url,
              duration,
              artist_id,
              artists!fk_audio_tracks_artist (
                display_name,
                slug
              )
            `)
            .in('id', playlist.audio_ids)
            .eq('status', 'ready');

          if (audioError) throw audioError;

          const audio = audioData?.map(a => ({
            ...a,
            kind: 'audio',
            content_type: 'audio' as const
          })) || [];

          allContent.push(...audio);
        }

        setContentItems(allContent);
      } else {
        // Get all published content from catalog
        // Fetch videos
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
          .limit(25);

        if (videosError) throw videosError;

        const videos = (videosData as any[])?.map(v => ({
          ...v,
          content_type: 'video' as const
        })) || [];

        allContent.push(...videos);

        // Fetch audio tracks
        const { data: audioData, error: audioError } = await supabase
          .from('audio_tracks')
          .select(`
            id,
            title,
            audio_url,
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
          .limit(25);

        if (audioError) throw audioError;

        const audio = (audioData as any[])?.map(a => ({
          ...a,
          kind: 'audio',
          content_type: 'audio' as const
        })) || [];

        allContent.push(...audio);

        // Shuffle to mix videos and audio
        allContent.sort(() => Math.random() - 0.5);

        setContentItems(allContent);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setContentItems([]);
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
            console.log(`[VerticalVideoFeed] Intersection:`, {
              index,
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
              target: contentItems[index]?.title
            });
            
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              console.log(`[VerticalVideoFeed] Setting activeIndex to:`, index, contentItems[index]?.title);
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
  }, [contentItems.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (contentItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No content available</p>
          <p className="text-sm mt-2">
            {mode === 'playlist' ? 'This playlist is empty' : 'No content in the catalog yet'}
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
      {contentItems.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => (observerRefs.current[index] = el)}
          className="h-full w-full"
        >
          <VideoFeedItem content={item} isActive={activeIndex === index} />
        </div>
      ))}
    </div>
  );
};
