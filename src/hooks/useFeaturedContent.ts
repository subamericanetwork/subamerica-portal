import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedItem {
  id: string;
  artist_id: string | null;
  content_id: string | null;
  content_type: string | null;
  priority: number;
  artists?: any;
}

export function useFeaturedContent() {
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('featured_content')
        .select('*, artists!featured_content_artist_id_fkey(*)')
        .lte('featured_from', now)
        .gte('featured_until', now)
        .order('priority', { ascending: false });

      if (error) throw error;
      setFeatured(data || []);
    } catch (error) {
      console.error('Error fetching featured content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedArtist = () => {
    return featured.find(item => item.content_type === 'artist' && item.artist_id);
  };

  return {
    featured,
    loading,
    getFeaturedArtist,
    refreshFeatured: fetchFeatured,
  };
}
