import { useEffect, useState } from 'react';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { MemberSidebar } from '@/components/member/MemberSidebar';
import { FeaturedArtistHero } from '@/components/member/FeaturedArtistHero';
import { ContentCarousel } from '@/components/member/ContentCarousel';
import { SceneCategories } from '@/components/member/SceneCategories';
import { NowPlayingPanel } from '@/components/member/NowPlayingPanel';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function MemberHome() {
  const { getFeaturedArtist } = useFeaturedContent();
  const { getRecentlyPlayed } = usePlaybackHistory();
  const [featuredArtist, setFeaturedArtist] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [popularVideos, setPopularVideos] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [verifiedArtists, setVerifiedArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // Featured artist
      const featured = getFeaturedArtist();
      if (featured?.artist_id) {
        const { data: artistData } = await supabase
          .from('artists')
          .select('*')
          .eq('id', featured.artist_id)
          .single();
        setFeaturedArtist(artistData);
      }

      // Recently played
      const recent = await getRecentlyPlayed(10);
      setRecentlyPlayed(recent);

      // Popular videos
      const { data: popular } = await supabase
        .from('videos')
        .select('id, title, thumb_url, video_url, duration, artist_id, artists!fk_videos_artist(id, display_name, slug, port_settings!inner(publish_status))')
        .eq('moderation_status', 'approved')
        .eq('status', 'ready')
        .eq('artists.port_settings.publish_status', 'published')
        .order('view_count', { ascending: false })
        .limit(10);
      console.log('🔍 Popular videos raw data:', popular);
      setPopularVideos(popular || []);

      // New releases
      const { data: newItems } = await supabase
        .from('videos')
        .select('id, title, thumb_url, video_url, duration, artist_id, artists!fk_videos_artist(id, display_name, slug, port_settings!inner(publish_status))')
        .eq('moderation_status', 'approved')
        .eq('status', 'ready')
        .eq('artists.port_settings.publish_status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);
      console.log('🔍 New releases raw data:', newItems);
      setNewReleases(newItems || []);

      // Verified artists
      const { data: verified } = await supabase
        .from('artists')
        .select('*, port_settings!inner(*)')
        .eq('is_verified', true)
        .eq('port_settings.publish_status', 'published')
        .limit(6);
      setVerifiedArtists(verified || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatContentItems = (items: any[]) => {
    return items.map(item => {
      console.log('🔍 Formatting item:', {
        raw: item,
        artists: item.artists,
        hasSlug: !!item.artists?.slug
      });
      const hasVideoUrl = !!item.video_url;
      return {
        id: item.id,
        title: item.title,
        type: (hasVideoUrl ? 'video' : 'audio') as 'video' | 'audio',
        thumbnail: item.thumb_url,
        artist: item.artists,
        video_url: item.video_url,
        audio_url: item.audio_url,
        duration: item.duration,
      };
    });
  };

  return (
    <MemberLayout>
      <div className="flex h-[calc(100vh-64px)]">
        <MemberSidebar />

        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6 space-y-8 pb-24">
            {loading ? (
              <>
                <Skeleton className="h-96 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
              </>
            ) : (
              <>
                {featuredArtist && <FeaturedArtistHero artist={featuredArtist} />}

                {recentlyPlayed.length > 0 && (
                  <ContentCarousel
                    title="Recently Played"
                    items={formatContentItems(recentlyPlayed)}
                  />
                )}

                {popularVideos.length > 0 && (
                  <ContentCarousel
                    title="Popular on Subamerica"
                    items={formatContentItems(popularVideos)}
                  />
                )}

                {newReleases.length > 0 && (
                  <ContentCarousel
                    title="New Releases"
                    items={formatContentItems(newReleases)}
                  />
                )}

                <SceneCategories />

                {verifiedArtists.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Verified Artists</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {verifiedArtists.map(artist => (
                        <a
                          key={artist.id}
                          href={`/port/${artist.slug}`}
                          className="group"
                        >
                          <div className="aspect-square rounded-full bg-muted mb-2 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                              🎤
                            </div>
                          </div>
                          <p className="font-medium text-center truncate group-hover:text-primary transition-colors">
                            {artist.display_name}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <NowPlayingPanel />
      </div>
    </MemberLayout>
  );
}
