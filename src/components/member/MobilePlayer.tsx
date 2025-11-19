import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LikeButton } from './LikeButton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

export function MobilePlayer() {
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrack) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Mini Player Bar - Fixed Above Bottom Nav */}
      <div 
        className="fixed bottom-16 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
            {currentTrack.thumbnail_url ? (
              <img
                src={currentTrack.thumbnail_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">
                🎵
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{currentTrack.title}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.artist_name || 'Unknown Artist'}
            </p>
          </div>

          {/* Play/Pause Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              isPlaying ? pause() : play();
            }}
            className="h-10 w-10 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Expand Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 flex-shrink-0"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-3 pb-2">
          <Slider
            value={[progress]}
            max={duration}
            step={1}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* Full Player Sheet */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <div className="h-full flex flex-col p-6">
            <SheetHeader className="mb-6">
              <SheetTitle>Now Playing</SheetTitle>
            </SheetHeader>

            <div className="flex-1 flex flex-col justify-center space-y-6">
              {/* Large Album Art */}
              <div className="aspect-square max-w-md mx-auto w-full rounded-lg bg-muted overflow-hidden">
                {currentTrack.thumbnail_url ? (
                  <img
                    src={currentTrack.thumbnail_url}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">🎵</span>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-2xl truncate">{currentTrack.title}</h3>
                    <button
                      onClick={() => {
                        if (currentTrack.artist_slug) {
                          navigate(`/${currentTrack.artist_slug}`);
                          setIsExpanded(false);
                        }
                      }}
                      className="text-lg text-muted-foreground hover:text-foreground truncate block disabled:cursor-not-allowed"
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

                {/* Progress Slider */}
                <div className="space-y-2 pt-4">
                  <Slider
                    value={[progress]}
                    max={duration}
                    step={1}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previous}
                  className="h-12 w-12"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>

                <Button
                  size="icon"
                  onClick={isPlaying ? pause : play}
                  className="h-16 w-16 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="h-7 w-7 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  className="h-12 w-12"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* About Artist Card */}
            <Card className="p-4 space-y-2 mt-6">
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
                    navigate(`/${currentTrack.artist_slug}`);
                    setIsExpanded(false);
                  }
                }}
                disabled={!currentTrack.artist_slug}
              >
                View Full Profile
              </Button>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
