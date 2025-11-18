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
      // Get unique content IDs from history
      const { data: historyData, error: historyError } = await supabase
        .from('playback_history')
        .select('content_id, content_type, artist_id')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(limit * 2); // Get more to account for duplicates

      if (historyError) throw historyError;
      
      // Separate video and audio IDs
      const videoIds = [...new Set(
        historyData
          ?.filter(h => h.content_type === 'video')
          .map(h => h.content_id) || []
      )].slice(0, limit);
      
      const audioIds = [...new Set(
        historyData
          ?.filter(h => h.content_type === 'audio')
          .map(h => h.content_id) || []
      )].slice(0, limit);

      const results = [];

      // Fetch video details with artist data
      if (videoIds.length > 0) {
        const { data: videos } = await supabase
          .from('videos')
          .select('id, title, thumb_url, video_url, duration, artist_id, artists!fk_videos_artist(id, display_name, slug)')
          .in('id', videoIds);
        
        if (videos) results.push(...videos);
      }

      // Fetch audio details with artist data
      if (audioIds.length > 0) {
        const { data: audio } = await supabase
          .from('audio_tracks')
          .select('id, title, thumb_url: thumbnail_url, audio_url, duration, artist_id, artists!fk_audio_tracks_artist(id, display_name, slug)')
          .in('id', audioIds);
        
        if (audio) results.push(...audio);
      }

      return results;
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
