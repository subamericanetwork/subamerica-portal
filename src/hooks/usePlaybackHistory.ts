import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryItem {
  id: string;
  content_id: string;
  content_type: string;
  played_at: string;
  artist_id: string | null;
}

export function usePlaybackHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async (limit = 50) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playback_history')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = async (
    contentId: string,
    contentType: 'video' | 'audio',
    artistId?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playback_history')
        .insert({
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          artist_id: artistId || null,
        });

      if (error) throw error;

      // Refresh history
      await fetchHistory();
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  };

  const getRecentlyPlayed = async (limit = 10) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('playback_history')
        .select('*, artists(*)')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recently played:', error);
      return [];
    }
  };

  return {
    history,
    loading,
    addToHistory,
    getRecentlyPlayed,
    refreshHistory: fetchHistory,
  };
}
