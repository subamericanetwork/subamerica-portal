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
    <div className="fixed top-[64px] right-4 z-30 border rounded-lg bg-background/95 backdrop-blur-sm shadow-lg animate-slide-in-from-top max-w-fit">
      <div className="px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Track Info */}
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={handleNavigateToPlaylists}
          >
            <img
              src={currentTrack.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'}
              alt={currentTrack.title}
              className="h-10 w-10 rounded object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400';
              }}
            />
            <div className="min-w-0 max-w-[200px]">
              <div className="flex items-center gap-1.5">
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

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
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
          
          {/* Close Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 opacity-50 hover:opacity-100"
            onClick={handleClose}
            title="Hide mini-player"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
