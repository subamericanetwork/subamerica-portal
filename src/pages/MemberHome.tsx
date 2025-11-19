import { useEffect, useState } from 'react';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { MemberSidebar } from '@/components/member/MemberSidebar';
import { FeaturedArtistHero } from '@/components/member/FeaturedArtistHero';
import { ContentCarousel } from '@/components/member/ContentCarousel';
import { SceneCategories } from '@/components/member/SceneCategories';
import { NowPlayingPanel } from '@/components/member/NowPlayingPanel';
import { MobilePlayer } from '@/components/member/MobilePlayer';
import { MobileBottomNav } from '@/components/member/MobileBottomNav';
import { TopFilters } from '@/components/member/TopFilters';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

export default function MemberHome() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getFeaturedArtist } = useFeaturedContent();
  const { getRecentlyPlayed } = usePlaybackHistory();
  const [featuredArtist, setFeaturedArtist] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [popularVideos, setPopularVideos] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [verifiedArtists, setVerifiedArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'music' | 'videos' | 'live' | 'playlists'>('all');

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

  const handleFilterChange = (filter: 'all' | 'music' | 'videos' | 'live' | 'playlists') => {
    if (filter === 'playlists') {
      navigate('/member/playlists');
      return;
    }
    setActiveFilter(filter);
  };

  const formatContentItems = (items: any[]) => {
    return items.map(item => {
      const hasVideoUrl = !!item.video_url;
      
      // Extract artist data - handle nested port_settings structure
      let artistData = item.artists;
      
      // If artists is an object with port_settings array, clean it up
      if (artistData && Array.isArray(artistData.port_settings)) {
        artistData = {
          id: artistData.id,
          display_name: artistData.display_name,
          slug: artistData.slug
        };
      }
      
      return {
        id: item.id,
        title: item.title,
        type: (hasVideoUrl ? 'video' : 'audio') as 'video' | 'audio',
        thumbnail: item.thumb_url,
        artist: artistData,
        video_url: item.video_url,
        audio_url: item.audio_url,
        duration: item.duration,
      };
    });
  };

  const filterContent = (items: any[]) => {
    if (activeFilter === 'all') return items;
    if (activeFilter === 'music') return items.filter(item => !item.video_url);
    if (activeFilter === 'videos') return items.filter(item => item.video_url);
    if (activeFilter === 'live') return []; // Can be expanded for live streams
    return items;
  };

  return (
    <MemberLayout>
      <div className={isMobile ? "flex flex-col min-h-screen" : "flex h-[calc(100vh-64px)]"}>
        {!isMobile && <MemberSidebar />}

        <div className="flex-1 overflow-y-auto">
          <TopFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />
          
          <div className={`container mx-auto p-6 space-y-8 ${isMobile ? 'pb-44' : 'pb-24'}`}>
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
                    items={formatContentItems(filterContent(recentlyPlayed))}
                  />
                )}

                {popularVideos.length > 0 && (
                  <ContentCarousel
                    title="Popular on Subamerica"
                    items={formatContentItems(filterContent(popularVideos))}
                  />
                )}

                {newReleases.length > 0 && (
                  <ContentCarousel
                    title="New Releases"
                    items={formatContentItems(filterContent(newReleases))}
                  />
                )}

                <SceneCategories />

                {verifiedArtists.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Browse by Artist</h2>
                    <div className={isMobile 
                      ? "flex flex-nowrap overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-2 scrollbar-hide" 
                      : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                    }>
                      {verifiedArtists.map(artist => (
              <a
                key={artist.id}
                href={`/${artist.slug}`}
                className={isMobile ? "flex-none w-32 snap-start group" : "group"}
              >
                          <div className="aspect-square rounded-full bg-muted mb-2 overflow-hidden">
                            {artist.brand?.profile_photo ? (
                              <img 
                                src={artist.brand.profile_photo} 
                                alt={artist.display_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-primary/20 to-primary/10 group-hover:scale-105 transition-transform">
                                {artist.display_name.charAt(0).toUpperCase()}
                              </div>
                            )}
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
        </div>

        {!isMobile && <NowPlayingPanel />}
      </div>
      
      {isMobile && (
        <>
          <MobilePlayer />
          <MobileBottomNav />
        </>
      )}
    </MemberLayout>
  );
}
