import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, SkipBack, SkipForward, Video as VideoIcon, Music, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enablePictureInPicture } from '@/lib/mediaUtils';

export const MiniPlayer = () => {
  const { currentTrack, isPlaying, contentType, viewMode, videoRef, miniPlayerVisible, play, pause, next, previous, setViewMode, setMiniPlayerVisible } = usePlayer();
  const navigate = useNavigate();

  if (!currentTrack || !miniPlayerVisible) return null;

  const handleNavigateToPlaylists = () => {
    navigate('/member/playlists');
  };

  const handleControlClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMiniPlayerVisible(false);
  };

  const handleVideoToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (viewMode === 'video') {
      setViewMode('audio');
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } else {
      setViewMode('video');
      // Wait a moment for the video element to load before enabling PIP
      setTimeout(async () => {
        if (videoRef?.current && videoRef.current.readyState >= 2) {
          await enablePictureInPicture(videoRef.current);
        }
      }, 300);
    }
  };

  return (
    <div className="fixed top-[64px] left-0 right-0 z-30 border-b bg-background/80 backdrop-blur-sm animate-slide-in-from-top">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="absolute -top-4 right-0 h-8 w-8 opacity-50 hover:opacity-100 z-10"
            onClick={handleClose}
            title="Hide mini-player"
          >
            <X className="h-4 w-4" />
          </Button>
          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={handleNavigateToPlaylists}
          >
          {/* Left: Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={currentTrack.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'}
              alt={currentTrack.title}
              className="h-12 w-12 rounded object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400';
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {currentTrack.title}
                </p>
                {contentType === 'video' && (
                  <Badge variant="secondary" className="h-5 px-1.5 gap-1 shrink-0">
                    <VideoIcon className="w-3 h-3" />
                    <span className="text-xs">Video</span>
                  </Badge>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentTrack.artist_slug) {
                    navigate(`/${currentTrack.artist_slug}`);
                  }
                }}
                className="text-xs text-muted-foreground truncate hover:text-primary hover:underline transition-colors text-left"
              >
                {currentTrack.artist_name}
              </button>
            </div>
          </div>

          {/* Center: Instructional Hint */}
          <div className="flex items-center gap-2 mx-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">Mini-Player Guide</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Click track info to open full player</li>
                      <li>Toggle between video (PIP) and audio modes</li>
                      <li>Use controls to manage playback</li>
                      <li>Click X to hide mini-player</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {contentType === 'video' && (
              <Button
                size="sm"
                variant={viewMode === 'video' ? 'default' : 'ghost'}
                className="h-8 w-8"
                onClick={handleVideoToggle}
                title={viewMode === 'video' ? 'Switch to audio-only mode' : 'Watch video in Picture-in-Picture window'}
              >
                {viewMode === 'video' ? (
                  <VideoIcon className="h-4 w-4" />
                ) : (
                  <Music className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => handleControlClick(e, previous)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-9 w-9"
              onClick={(e) => handleControlClick(e, isPlaying ? pause : play)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => handleControlClick(e, next)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
