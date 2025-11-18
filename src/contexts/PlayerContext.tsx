import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { detectMediaType } from '@/lib/mediaUtils';
import { useMediaTracking } from '@/hooks/useMediaTracking';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string;
  artist_slug: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
}

type ViewMode = 'audio' | 'video' | 'auto';

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
  viewMode: ViewMode;
  contentType: 'video' | 'audio';
  miniPlayerVisible: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  visibleVideoRef: React.RefObject<HTMLVideoElement>;
  setPlaylist: (playlistId: string) => void;
  playTracks: (tracks: Track[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  skipTo: (index: number) => void;
  seek: (time: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setViewMode: (mode: ViewMode) => void;
  setMiniPlayerVisible: (visible: boolean) => void;
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
  const { trackPlay, trackPause, trackEnded, trackSeek } = useMediaTracking();
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visibleVideoRef = useRef<HTMLVideoElement>(null);
  
  const [playlistId, setPlaylistIdState] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const [viewMode, setViewModeState] = useState<ViewMode>('auto');
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(true);

  const currentTrack = tracks[currentTrackIndex] || null;
  
  // Debug logging for render
  console.log('[Player] render', { 
    currentTrackIndex, 
    tracksLength: tracks.length, 
    currentTrackTitle: currentTrack?.title 
  });
  
  // Detect content type based on current track
  const contentType = currentTrack ? detectMediaType(currentTrack.video_url) : 'audio';
  
  // Determine effective view mode
  const effectiveViewMode = viewMode === 'auto' ? contentType : viewMode;

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
          .select('video_ids, audio_ids')
          .eq('id', playlistId)
          .single();

        if (playlist) {
          const allTracks: Track[] = [];
          const allArtistIds: string[] = [];

          // Fetch videos if any
          if (playlist.video_ids && playlist.video_ids.length > 0) {
            const { data: videos } = await supabase
              .from('videos')
              .select('id, title, artist_id, thumb_url, video_url, duration')
              .in('id', playlist.video_ids);

            if (videos) {
              allArtistIds.push(...videos.map(v => v.artist_id));
              allTracks.push(...videos.map(v => ({
                id: v.id,
                title: v.title,
                artist_name: '',
                artist_id: v.artist_id,
                artist_slug: '',
                thumbnail_url: v.thumb_url,
                video_url: v.video_url || '',
                duration: v.duration || 0,
              })));
            }
          }

          // Fetch audio tracks if any
          if (playlist.audio_ids && playlist.audio_ids.length > 0) {
            const { data: audioTracks } = await supabase
              .from('audio_tracks')
              .select('id, title, artist_id, thumb_url, audio_url, duration')
              .in('id', playlist.audio_ids);

            if (audioTracks) {
              allArtistIds.push(...audioTracks.map(a => a.artist_id));
              allTracks.push(...audioTracks.map(a => ({
                id: a.id,
                title: a.title,
                artist_name: '',
                artist_id: a.artist_id,
                artist_slug: '',
                thumbnail_url: a.thumb_url,
                video_url: a.audio_url || '',
                duration: a.duration || 0,
              })));
            }
          }

          // Get artist names and slugs for all tracks
          if (allArtistIds.length > 0) {
            const { data: artists } = await supabase
              .from('artists')
              .select('id, display_name, slug')
              .in('id', allArtistIds);

            const artistMap = new Map(artists?.map(a => [a.id, { name: a.display_name, slug: a.slug }]) || []);

            // Update tracks with artist info
            allTracks.forEach(track => {
              track.artist_name = artistMap.get(track.artist_id)?.name || 'Unknown Artist';
              track.artist_slug = artistMap.get(track.artist_id)?.slug || '';
            });
          }

          setTracks(allTracks);
          setCurrentTrackIndex(0);
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

  // Handle audio/video events
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    const activeMedia = effectiveViewMode === 'video' ? video : audio;
    
    if (!activeMedia) return;

    const updateProgress = () => {
      setProgress(activeMedia.currentTime);
      setDuration(activeMedia.duration || 0);
    };

    const handleEnded = () => {
      // Track ended event
      if (currentTrack) {
        trackEnded({
          contentId: currentTrack.id,
          title: currentTrack.title,
          artistName: currentTrack.artist_name,
          contentType: contentType,
          duration: currentTrack.duration,
          playlistId: playlistId || undefined,
          playerType: 'jukebox',
        });
      }
      
      if (repeat === 'one') {
        playTrackAtIndex(currentTrackIndex);
      } else if (repeat === 'all' || currentTrackIndex < tracks.length - 1) {
        next();
      } else {
        setIsPlaying(false);
      }
    };

    activeMedia.addEventListener('timeupdate', updateProgress);
    activeMedia.addEventListener('loadedmetadata', updateProgress);
    activeMedia.addEventListener('ended', handleEnded);

    return () => {
      activeMedia.removeEventListener('timeupdate', updateProgress);
      activeMedia.removeEventListener('loadedmetadata', updateProgress);
      activeMedia.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, tracks.length, repeat, effectiveViewMode, trackEnded, currentTrack, contentType, playlistId]);

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
    setCurrentTrackIndex(0);
  };

  const playTracks = (newTracks: Track[], startIndex: number = 0) => {
    setPlaylistIdState(null); // Clear playlist ID
    setTracks(newTracks);
    setCurrentTrackIndex(startIndex);
    setIsPlaying(true);
    setMiniPlayerVisible(true);
  };

  const play = () => {
    if (currentTrack) {
      if (effectiveViewMode === 'video' && videoRef.current) {
        videoRef.current.play();
      } else if (audioRef.current) {
        audioRef.current.play();
      }
      setIsPlaying(true);
      
      // Track play event
      trackPlay({
        contentId: currentTrack.id,
        title: currentTrack.title,
        artistName: currentTrack.artist_name,
        contentType: contentType,
        duration: currentTrack.duration,
        playlistId: playlistId || undefined,
        playerType: 'jukebox',
      });
    }
  };

  const pause = () => {
    const currentTime = effectiveViewMode === 'video' 
      ? videoRef.current?.currentTime || 0 
      : audioRef.current?.currentTime || 0;
      
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    
    // Track pause event
    if (currentTrack) {
      trackPause({
        contentId: currentTrack.id,
        title: currentTrack.title,
        artistName: currentTrack.artist_name,
        contentType: contentType,
        duration: currentTrack.duration,
        currentTime: currentTime,
        playlistId: playlistId || undefined,
        playerType: 'jukebox',
      });
    }
  };
  
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('player-view-mode', mode);
  };
  
  // Load saved view mode
  useEffect(() => {
    const saved = localStorage.getItem('player-view-mode') as ViewMode;
    if (saved) {
      setViewModeState(saved);
    }
  }, []);

  // Helper to handle only media element playback (no state updates)
  const playTrackMediaAtIndex = (index: number) => {
    const track = tracks[index];
    if (!track) {
      console.warn('[Player] playTrackMediaAtIndex: no track at index', index);
      return;
    }

    console.log('[Player] playTrackMediaAtIndex', { index, trackId: track.id, title: track.title });

    // Determine which media element to use
    const mediaType = detectMediaType(track.video_url);
    const mode = viewMode === 'auto' ? mediaType : viewMode;
    const media = mode === 'video' ? videoRef.current : audioRef.current;

    // Pause both media elements to avoid overlap
    if (videoRef.current) videoRef.current.pause();
    if (audioRef.current) audioRef.current.pause();

    // If no media element is available yet, just update state and exit
    if (!media) {
      console.warn('[Player] playTrackMediaAtIndex: no media element available');
      setIsPlaying(false);
      return;
    }

    // Set the source and reset position
    media.src = track.video_url || '';
    media.currentTime = 0;

    // Reset progress/duration for UI
    setProgress(0);
    setDuration(track.duration || 0);

    // Load and play
    media.load();
    const playPromise = media.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[Player] playback started successfully');
          setIsPlaying(true);
          
          // Track media play
          trackPlay({
            contentId: track.id,
            title: track.title,
            artistName: track.artist_name,
            contentType: mediaType,
            duration: track.duration,
            playlistId: playlistId || undefined,
            playerType: 'jukebox',
          });
        })
        .catch((error) => {
          console.error('[Player] playback error:', error);
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(true);
      
      trackPlay({
        contentId: track.id,
        title: track.title,
        artistName: track.artist_name,
        contentType: mediaType,
        duration: track.duration,
        playlistId: playlistId || undefined,
        playerType: 'jukebox',
      });
    }
  };

  // Helper function to play a specific track by index
  const playTrackAtIndex = (index: number) => {
    console.log('[Player] playTrackAtIndex called', { index, tracksLength: tracks.length });
    
    if (index < 0 || index >= tracks.length) {
      console.warn('[Player] playTrackAtIndex: index out of bounds');
      return;
    }

    // Update the track index state
    setCurrentTrackIndex(index);
    
    // Handle media playback
    playTrackMediaAtIndex(index);
  };
  const next = () => {
    if (tracks.length === 0) return;

    setCurrentTrackIndex(prevIndex => {
      const nextIndex = shuffle
        ? Math.floor(Math.random() * tracks.length)
        : (prevIndex + 1) % tracks.length;

      console.log('[Player] next()', { prevIndex, nextIndex, tracksLength: tracks.length });
      playTrackMediaAtIndex(nextIndex);
      return nextIndex;
    });
  };

  const previous = () => {
    if (tracks.length === 0) return;

    setCurrentTrackIndex(prevIndex => {
      const prevIndexComputed = prevIndex === 0 ? tracks.length - 1 : prevIndex - 1;
      console.log('[Player] previous()', { prevIndex, prevIndexComputed, tracksLength: tracks.length });
      playTrackMediaAtIndex(prevIndexComputed);
      return prevIndexComputed;
    });
  };

  const skipTo = (index: number) => {
    console.log('[Player] skipTo()', { requestedIndex: index, tracksLength: tracks.length });
    
    if (index < 0 || index >= tracks.length) {
      console.warn('[Player] skipTo: index out of bounds');
      return;
    }
    
    setCurrentTrackIndex(index);
    playTrackMediaAtIndex(index);
  };

  const seek = (time: number) => {
    const activeMedia = effectiveViewMode === 'video' ? videoRef.current : audioRef.current;
    if (activeMedia && currentTrack) {
      const fromTime = activeMedia.currentTime;
      activeMedia.currentTime = time;
      setProgress(time);
      
      // Track seek event
      trackSeek({
        contentId: currentTrack.id,
        title: currentTrack.title,
        artistName: currentTrack.artist_name,
        contentType: contentType,
        duration: currentTrack.duration,
        fromTime: fromTime,
        toTime: time,
      });
    }
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off');
  };

  // Sync UI state when track changes (playTrackAtIndex handles actual playback)
  useEffect(() => {
    if (!currentTrack) return;
    
    // Just ensure progress/duration are in sync with current track
    setProgress(0);
    setDuration(currentTrack.duration || 0);
  }, [currentTrack]);

  // Auto-show mini-player when a new track plays
  useEffect(() => {
    if (currentTrack) {
      setMiniPlayerVisible(true);
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
    viewMode,
    contentType,
    miniPlayerVisible,
    audioRef,
    videoRef,
    visibleVideoRef,
    setPlaylist,
    playTracks,
    play,
    pause,
    next,
    previous,
    skipTo,
    seek,
    toggleShuffle,
    toggleRepeat,
    setViewMode,
    setMiniPlayerVisible,
  };

  return (
    <PlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={effectiveViewMode === 'audio' ? currentTrack?.video_url : undefined}
        className="hidden"
      />
      <video
        ref={videoRef}
        src={effectiveViewMode === 'video' ? currentTrack?.video_url : undefined}
        className="hidden"
        playsInline
      />
      {children}
    </PlayerContext.Provider>
  );
};
