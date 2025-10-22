import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, SkipForward, Video as VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MiniPlayer = () => {
  const { currentTrack, isPlaying, contentType, play, pause, next, previous } = usePlayer();
  const navigate = useNavigate();

  if (!currentTrack) return null;

  const handleNavigateToPlaylists = () => {
    navigate('/member/playlists');
  };

  const handleControlClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="fixed top-[64px] left-0 right-0 z-30 border-b bg-background/80 backdrop-blur-sm animate-slide-in-from-top">
      <div className="mx-auto max-w-7xl px-4 py-2">
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
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist_name}
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
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
  );
};
