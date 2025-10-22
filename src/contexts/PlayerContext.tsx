import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
}

interface PlayerContextType {
  playlistId: string | null;
  tracks: Track[];
  currentTrackIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  loading: boolean;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  audioRef: React.RefObject<HTMLAudioElement>;
  setPlaylist: (playlistId: string) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  skipTo: (index: number) => void;
  seek: (time: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [playlistId, setPlaylistIdState] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');

  const currentTrack = tracks[currentTrackIndex] || null;

  // Fetch playlist tracks when playlistId changes
  useEffect(() => {
    if (!playlistId) {
      setTracks([]);
      return;
    }

    const fetchPlaylistTracks = async () => {
      setLoading(true);
      try {
        const { data: playlist } = await supabase
          .from('member_playlists')
          .select('video_ids')
          .eq('id', playlistId)
          .single();

        if (playlist && playlist.video_ids && playlist.video_ids.length > 0) {
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
            setCurrentTrackIndex(0);
          }
        } else {
          setTracks([]);
        }
      } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistTracks();
  }, [playlistId]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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

  // Clear player on logout
  useEffect(() => {
    if (!user) {
      pause();
      setPlaylistIdState(null);
      setTracks([]);
      setCurrentTrackIndex(0);
    }
  }, [user]);

  const setPlaylist = (id: string) => {
    setPlaylistIdState(id);
  };

  const play = () => {
    if (audioRef.current && currentTrack) {
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
    if (tracks.length === 0) return;
    let nextIndex: number;
    
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const previous = () => {
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  const skipTo = (index: number) => {
    if (index >= 0 && index < tracks.length) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
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
    setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off');
  };

  // Auto-play when track changes
  useEffect(() => {
    if (currentTrack && isPlaying && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentTrack]);

  const value: PlayerContextType = {
    playlistId,
    tracks,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    progress,
    duration,
    loading,
    shuffle,
    repeat,
    audioRef,
    setPlaylist,
    play,
    pause,
    next,
    previous,
    skipTo,
    seek,
    toggleShuffle,
    toggleRepeat,
  };

  return (
    <PlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={currentTrack?.video_url}
        className="hidden"
      />
      {children}
    </PlayerContext.Provider>
  );
};
