import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  thumbnail_url: string | null;
  video_url: string;
  duration: number;
}

export const useJukeboxPlayer = (playlistId: string | null) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch playlist tracks
  useEffect(() => {
    if (!playlistId) return;

    const fetchTracks = async () => {
      setLoading(true);
      try {
        const { data: playlist } = await supabase
          .from('member_playlists')
          .select('video_ids')
          .eq('id', playlistId)
          .single();

        if (playlist && playlist.video_ids.length > 0) {
          const { data: videos } = await supabase
            .from('videos')
            .select('id, title, artist_id, thumb_url, video_url, duration')
            .in('id', playlist.video_ids);

          if (videos) {
            // Get artist names
            const artistIds = videos.map(v => v.artist_id);
            const { data: artists } = await supabase
              .from('artists')
              .select('id, display_name')
              .in('id', artistIds);

            const artistMap = new Map(artists?.map(a => [a.id, a.display_name]) || []);

            const tracksData: Track[] = videos.map(v => ({
              id: v.id,
              title: v.title,
              artist_name: artistMap.get(v.artist_id) || 'Unknown Artist',
              thumbnail_url: v.thumb_url,
              video_url: v.video_url || '',
              duration: v.duration || 0,
            }));

            setTracks(tracksData);
          }
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlistId]);

  // Update progress
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeat === 'all' || currentTrackIndex < tracks.length - 1) {
        next();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, tracks.length, repeat]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const next = () => {
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((i) => (i + 1) % tracks.length);
    }
  };

  const previous = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      setCurrentTrackIndex((i) => (i - 1 + tracks.length) % tracks.length);
    }
  };

  const skipTo = (index: number) => {
    setCurrentTrackIndex(index);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    setRepeat(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const currentTrack = tracks[currentTrackIndex] || null;

  return {
    tracks,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    progress,
    duration,
    loading,
    shuffle,
    repeat,
    audioRef,
    play,
    pause,
    next,
    previous,
    skipTo,
    seek,
    toggleShuffle,
    toggleRepeat,
  };
};
