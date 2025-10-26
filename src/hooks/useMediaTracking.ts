import { useCallback } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface MediaTrackingParams {
  contentId: string;
  title: string;
  artistName: string;
  contentType: 'video' | 'audio';
  duration: number;
  playlistId?: string;
  playerType?: 'feed' | 'jukebox' | 'mini-player';
}

export const useMediaTracking = () => {
  const trackPlay = useCallback((params: MediaTrackingParams) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', params.contentType === 'video' ? 'video_play' : 'audio_play', {
        content_id: params.contentId,
        content_title: params.title,
        artist_name: params.artistName,
        duration: params.duration,
        playlist_id: params.playlistId || 'none',
        player_type: params.playerType || 'unknown',
      });
      console.log(`[GA] ${params.contentType}_play:`, params.title);
    }
  }, []);

  const trackPause = useCallback((params: MediaTrackingParams & { currentTime: number }) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', params.contentType === 'video' ? 'video_pause' : 'audio_pause', {
        content_id: params.contentId,
        content_title: params.title,
        artist_name: params.artistName,
        current_time: params.currentTime,
        duration: params.duration,
        watch_percentage: Math.round((params.currentTime / params.duration) * 100),
        playlist_id: params.playlistId || 'none',
        player_type: params.playerType || 'unknown',
      });
      console.log(`[GA] ${params.contentType}_pause:`, params.title, `at ${params.currentTime}s`);
    }
  }, []);

  const trackEnded = useCallback((params: MediaTrackingParams) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', params.contentType === 'video' ? 'video_ended' : 'audio_ended', {
        content_id: params.contentId,
        content_title: params.title,
        artist_name: params.artistName,
        duration: params.duration,
        playlist_id: params.playlistId || 'none',
        player_type: params.playerType || 'unknown',
      });
      console.log(`[GA] ${params.contentType}_ended:`, params.title);
    }
  }, []);

  const trackSeek = useCallback((params: MediaTrackingParams & { fromTime: number; toTime: number }) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', params.contentType === 'video' ? 'video_seek' : 'audio_seek', {
        content_id: params.contentId,
        content_title: params.title,
        from_time: params.fromTime,
        to_time: params.toTime,
        seek_direction: params.toTime > params.fromTime ? 'forward' : 'backward',
      });
      console.log(`[GA] ${params.contentType}_seek:`, `${params.fromTime}s → ${params.toTime}s`);
    }
  }, []);

  return {
    trackPlay,
    trackPause,
    trackEnded,
    trackSeek,
  };
};
