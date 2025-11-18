import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LikeButton } from './LikeButton';

export function NowPlayingPanel() {
  const {
    currentTrack,
    isPlaying,
    play,
    pause,
    next,
    previous,
    progress,
    duration,
  } = usePlayer();

  const navigate = useNavigate();

  if (!currentTrack) {
    return (
      <div className="w-96 border-l bg-card p-6">
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            No track playing
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-96 border-l bg-card flex flex-col h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Now Playing</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/member/playlists')}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="aspect-square rounded-lg bg-muted overflow-hidden">
            {currentTrack.thumbnail_url ? (
              <img
                src={currentTrack.thumbnail_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🎵</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{currentTrack.title}</h4>
                <button
                  onClick={() => {
                    if (currentTrack.artist_slug) {
                      navigate(`/port/${currentTrack.artist_slug}`);
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground truncate block disabled:cursor-not-allowed"
                  disabled={!currentTrack.artist_slug}
                >
                  {currentTrack.artist_name || 'Unknown Artist'}
                </button>
              </div>
              <LikeButton
                contentId={currentTrack.id}
                contentType="audio"
              />
            </div>

            <div className="space-y-2">
              <Slider
                value={[progress]}
                max={duration}
                step={1}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={previous}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              onClick={isPlaying ? pause : play}
              className="h-12 w-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={next}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

        </div>

        <Card className="p-4 space-y-2">
          <h4 className="font-semibold text-sm">About the Artist</h4>
          <p className="text-sm text-muted-foreground">
            {currentTrack.artist_name}
          </p>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={() => {
              if (currentTrack.artist_slug) {
                navigate(`/port/${currentTrack.artist_slug}`);
              }
            }}
            disabled={!currentTrack.artist_slug}
          >
            View Full Profile
          </Button>
        </Card>
      </div>
    </div>
  );
}
