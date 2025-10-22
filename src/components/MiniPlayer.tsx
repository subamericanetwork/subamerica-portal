import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, SkipBack, SkipForward, Video as VideoIcon, Music, X, Info, GripVertical, Maximize, PictureInPicture } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enablePictureInPicture, toggleFullscreen } from '@/lib/mediaUtils';
import { useState, useEffect, useRef } from 'react';

export const MiniPlayer = () => {
  const { currentTrack, isPlaying, contentType, viewMode, videoRef, visibleVideoRef, miniPlayerVisible, play, pause, next, previous, setViewMode, setMiniPlayerVisible } = usePlayer();
  const navigate = useNavigate();
  
  const [position, setPosition] = useState({ x: 0, y: 64 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('miniPlayerPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        // Default to top-right if parsing fails
        setPosition({ x: window.innerWidth - 400, y: 64 });
      }
    } else {
      // Default to top-right
      setPosition({ x: window.innerWidth - 400, y: 64 });
    }
  }, []);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (!playerRef.current) return;
      const rect = playerRef.current.getBoundingClientRect();
      const newX = Math.min(position.x, window.innerWidth - rect.width - 16);
      const newY = Math.min(position.y, window.innerHeight - rect.height - 16);
      if (newX !== position.x || newY !== position.y) {
        const newPosition = { x: Math.max(16, newX), y: Math.max(64, newY) };
        setPosition(newPosition);
        localStorage.setItem('miniPlayerPosition', JSON.stringify(newPosition));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleDrag = (e: MouseEvent) => {
      if (!playerRef.current) return;
      
      const rect = playerRef.current.getBoundingClientRect();
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      // Boundary checking
      newX = Math.max(16, Math.min(newX, window.innerWidth - rect.width - 16));
      newY = Math.max(64, Math.min(newY, window.innerHeight - rect.height - 16));

      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      localStorage.setItem('miniPlayerPosition', JSON.stringify(position));
    };

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragStart, position]);

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

  const handleDragStart = (e: React.MouseEvent) => {
    if (!playerRef.current) return;
    const rect = playerRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handlePictureInPicture = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetVideo = visibleVideoRef?.current || videoRef?.current;
    if (targetVideo) {
      await enablePictureInPicture(targetVideo);
    }
  };

  const handleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetVideo = visibleVideoRef?.current || videoRef?.current;
    if (targetVideo?.parentElement) {
      await toggleFullscreen(targetVideo.parentElement);
    }
  };

  return (
    <div 
      ref={playerRef}
      className={cn(
        "fixed z-30 border rounded-lg bg-background/95 backdrop-blur-sm max-w-fit transition-shadow",
        isDragging ? "shadow-2xl cursor-grabbing" : "shadow-lg"
      )}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            className={cn(
              "shrink-0 border-r pr-2 -ml-1",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onMouseDown={handleDragStart}
            title="Drag to move player"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
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
            
            {/* Video Controls - Only show when in video mode */}
            {contentType === 'video' && viewMode === 'video' && (visibleVideoRef?.current || videoRef?.current) && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handlePictureInPicture}
                      >
                        <PictureInPicture className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Picture in Picture</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleFullscreen}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fullscreen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
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
