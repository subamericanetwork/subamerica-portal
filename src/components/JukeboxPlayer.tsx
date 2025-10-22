import { useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Menu,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  Video,
  Maximize,
  PictureInPicture
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { enablePictureInPicture, toggleFullscreen } from '@/lib/mediaUtils';

interface JukeboxPlayerProps {
  playlistId: string;
  className?: string;
}

export const JukeboxPlayer = ({ playlistId, className }: JukeboxPlayerProps) => {
  const {
    tracks,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    progress,
    duration,
    loading,
    shuffle,
    repeat,
    viewMode,
    contentType,
    videoRef,
    play,
    pause,
    next,
    previous,
    skipTo,
    seek,
    toggleShuffle,
    toggleRepeat,
    setPlaylist,
    setViewMode,
  } = usePlayer();
  
  const effectiveViewMode = viewMode === 'auto' ? contentType : viewMode;

  // Set playlist when component mounts or playlistId changes
  useEffect(() => {
    if (playlistId) {
      setPlaylist(playlistId);
    }
  }, [playlistId, setPlaylist]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-muted-foreground">Loading playlist...</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>No tracks in this playlist</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("jukebox-container", className)}>
      {/* Top Section - Now Playing */}
      <div className="jukebox-top">
        {/* Main playback area */}
        <div className="jukebox-playback">
          {/* Top Corner decorative buttons */}
          <button 
            className={cn("corner-button top-left", shuffle && "active")}
            onClick={toggleShuffle}
            aria-label="Toggle Shuffle"
          />
          <button 
            className={cn("corner-button top-right", repeat !== 'off' && "active")}
            onClick={toggleRepeat}
            aria-label="Toggle Repeat"
          />

          {/* Vertical accent divider */}
          <div className="vertical-divider top" />

          {/* Now Playing Info */}
          <div className="now-playing-info">
            <h2 className="now-playing-label">Now Playing:</h2>
            <h3 className="song-title">{currentTrack?.title} – {currentTrack?.artist_name}</h3>
          </div>

          {/* Media Display Area - Video or Album Art */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {effectiveViewMode === 'video' && currentTrack?.video_url ? (
              <div className="relative w-80 h-80 rounded-lg overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  src={currentTrack.video_url}
                  poster={currentTrack.thumbnail_url}
                  className="w-full h-full object-cover"
                  playsInline
                  onClick={isPlaying ? pause : play}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        enablePictureInPicture(videoRef.current);
                      }
                    }}
                  >
                    <PictureInPicture className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current?.parentElement) {
                        toggleFullscreen(videoRef.current.parentElement);
                      }
                    }}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              currentTrack?.thumbnail_url && (
                <div className="w-48 h-48 rounded-lg overflow-hidden shadow-2xl opacity-40 blur-sm pointer-events-none">
                  <img
                    src={currentTrack.thumbnail_url}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )
            )}
          </div>

          {/* Central Play Button with Glow Rings */}
          <div className="play-button-container">
            <div className="glow-ring outer" />
            <div className="glow-ring middle" />
            <div className="glow-ring inner" />
            <div className="glow-ring center" />
            <button
              onClick={isPlaying ? pause : play}
              className="play-button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-12 w-12" />
              ) : (
                <Play className="h-12 w-12 ml-1" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <span className="progress-label left">SUAP</span>
            <div className="progress-bar" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = x / rect.width;
              seek(percent * duration);
            }}>
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercent}%` }}
              />
              <div 
                className="progress-handle" 
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-label right">SKIP</span>
          </div>

          {/* Control Buttons */}
          <div className="controls">
            <button className="control-btn" onClick={toggleShuffle}>
              <Shuffle className={cn("h-5 w-5", shuffle && "text-primary")} />
            </button>
            <button className="control-btn" onClick={previous}>
              <SkipBack className="h-6 w-6" />
            </button>
            <button className="control-btn primary" onClick={isPlaying ? pause : play}>
              {isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7 ml-0.5" />
              )}
            </button>
            <button className="control-btn" onClick={next}>
              <SkipForward className="h-6 w-6" />
            </button>
            <button className="control-btn" onClick={toggleRepeat}>
              {repeat === 'one' ? (
                <Repeat1 className={cn("h-5 w-5", "text-primary")} />
              ) : (
                <Repeat className={cn("h-5 w-5", repeat !== 'off' && "text-primary")} />
              )}
            </button>
            <button 
              className="control-btn" 
              onClick={() => setViewMode(effectiveViewMode === 'video' ? 'audio' : 'video')}
              title={effectiveViewMode === 'video' ? 'Switch to Audio Mode' : 'Switch to Video Mode'}
            >
              {effectiveViewMode === 'video' ? (
                <Music className={cn("h-5 w-5")} />
              ) : (
                <Video className={cn("h-5 w-5")} />
              )}
            </button>
          </div>

          {/* Bottom Corner decorative buttons */}
          <div className="corner-button bottom-left" />
          <div className="corner-button bottom-right" />
          
          {/* Vertical accent divider */}
          <div className="vertical-divider bottom" />
        </div>
      </div>

      {/* Bottom Section - Queue */}
      <div className="jukebox-bottom">
        <ScrollArea className="queue-scroll-container">
          <div className="flex gap-6 pb-4 px-2">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => skipTo(index)}
                className={cn(
                  "queue-card",
                  index === currentTrackIndex && "active"
                )}
              >
                <img
                  src={track.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'}
                  alt={track.title}
                  className="queue-thumbnail"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400';
                  }}
                />
                <div className="queue-info">
                  <h4 className="queue-title">
                    {track.title}
                  </h4>
                  <p className="queue-artist">
                    {track.artist_name}
                  </p>
                  <div className="queue-chevron">›</div>
                </div>
                <div className="progress-dots">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "dot",
                        i === 0 && index === currentTrackIndex && "active"
                      )}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
