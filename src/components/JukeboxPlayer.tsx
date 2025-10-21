import { useJukeboxPlayer } from '@/hooks/useJukeboxPlayer';
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
  Repeat1
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    audioRef,
    play,
    pause,
    next,
    previous,
    skipTo,
    seek,
    toggleShuffle,
    toggleRepeat,
  } = useJukeboxPlayer(playlistId);

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
    <div className={cn("jukebox-container mx-auto max-w-4xl", className)}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.video_url}
        onPlay={() => play()}
        onPause={() => pause()}
      />

      {/* Top Section - Now Playing */}
      <div className="jukebox-top">
        {/* Header with playlist controls */}
        <div className="jukebox-header mb-6 flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-bold text-foreground">Now Playing</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShuffle}
              className={cn(shuffle && "text-primary")}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRepeat}
              className={cn(repeat !== 'off' && "text-primary")}
            >
              {repeat === 'one' ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Main playback area */}
        <div className="jukebox-playback relative px-8 pb-8">
          {/* Corner decorative buttons */}
          <div className="corner-button top-left" />
          <div className="corner-button top-right" />

          {/* Now Playing Info */}
          <div className="now-playing-info mb-6 text-center">
            <h3 className="text-lg font-semibold text-primary">
              {currentTrack?.title}
            </h3>
            <p className="text-muted-foreground">
              {currentTrack?.artist_name}
            </p>
          </div>

          {/* Central Play Button with Glow Effect */}
          <div className="play-button-container mx-auto mb-8">
            <div className="glow-ring outer" />
            <div className="glow-ring middle" />
            <div className="glow-ring inner" />
            <button
              onClick={isPlaying ? pause : play}
              className="play-button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-background" />
              ) : (
                <Play className="h-8 w-8 text-background" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-container mb-6 flex items-center gap-4 px-4">
            <span className="progress-label text-xs font-semibold text-primary">
              {formatTime(progress)}
            </span>
            <div className="progress-bar flex-1" onClick={(e) => {
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
            <span className="progress-label text-xs font-semibold text-primary">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="controls mb-4">
            <button className="control-btn">
              <Menu className="h-5 w-5" />
            </button>
            <button className="control-btn" onClick={previous}>
              <SkipBack className="h-5 w-5" />
            </button>
            <button className="control-btn primary" onClick={isPlaying ? pause : play}>
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
            <button className="control-btn" onClick={next}>
              <SkipForward className="h-5 w-5" />
            </button>
            <button className="control-btn">
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Decorative elements */}
          <div className="corner-button bottom-left" />
          <div className="corner-button bottom-right" />
          <div className="vertical-accent left" />
          <div className="vertical-accent right" />
        </div>
      </div>

      {/* Bottom Section - Queue */}
      <div className="jukebox-bottom">
        <ScrollArea className="queue-scroll-container">
          <div className="flex gap-4 pb-4">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => skipTo(index)}
                className={cn(
                  "queue-card min-w-[280px]",
                  index === currentTrackIndex && "border-primary"
                )}
              >
                <img
                  src={track.thumbnail_url || '/placeholder.svg'}
                  alt={track.title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="queue-info flex-1">
                  <h4 className="line-clamp-1 font-semibold text-sm">
                    {track.title}
                  </h4>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {track.artist_name}
                  </p>
                  <div className="queue-progress mt-2">
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
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
