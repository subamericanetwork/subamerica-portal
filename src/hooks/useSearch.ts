import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResults {
  artists: any[];
  videos: any[];
  audio: any[];
  playlists: any[];
}

export function useSearch() {
  const [results, setResults] = useState<SearchResults>({
    artists: [],
    videos: [],
    audio: [],
    playlists: [],
  });
  const [loading, setLoading] = useState(false);

  const search = async (query: string) => {
    if (!query || query.length < 2) {
      setResults({ artists: [], videos: [], audio: [], playlists: [] });
      return;
    }

    setLoading(true);

    try {
      const searchPattern = `%${query}%`;

      // Search artists
      const { data: artistsData } = await supabase
        .from('artists')
        .select('*, port_settings!inner(*)')
        .ilike('display_name', searchPattern)
        .eq('port_settings.publish_status', 'published')
        .limit(5);

      // Search videos
      const { data: videosData } = await supabase
        .from('videos')
        .select('*, artists(*)')
        .ilike('title', searchPattern)
        .eq('moderation_status', 'approved')
        .eq('status', 'ready')
        .limit(5);

      // Search audio
      const { data: audioData } = await supabase
        .from('audio_tracks')
        .select('*, artists(*)')
        .ilike('title', searchPattern)
        .eq('moderation_status', 'approved')
        .limit(5);

      // Search playlists (public only)
      const { data: playlistsData } = await supabase
        .from('member_playlists')
        .select('*')
        .ilike('name', searchPattern)
        .eq('is_public', true)
        .limit(5);

      setResults({
        artists: artistsData || [],
        videos: videosData || [],
        audio: audioData || [],
        playlists: playlistsData || [],
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    search,
  };
}
