import { useState } from 'react';
import { Heart, Plus, Share2, User } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PlaylistSelectionSheet } from './PlaylistSelectionSheet';

interface VideoFeedControlsProps {
  videoId: string;
  artistId: string;
  artistSlug?: string;
}

export const VideoFeedControls = ({ videoId, artistId, artistSlug }: VideoFeedControlsProps) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaylistSheetOpen, setIsPlaylistSheetOpen] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleArtistClick = () => {
    if (artistSlug) {
      navigate(`/${artistSlug}`);
    }
  };

  return (
    <>
      <div className="absolute right-4 bottom-24 flex flex-col gap-4 z-10">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleLike}
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full h-12 w-12"
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsPlaylistSheetOpen(true)}
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full h-12 w-12"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={handleShare}
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full h-12 w-12"
        >
          <Share2 className="h-5 w-5" />
        </Button>

        {artistSlug && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleArtistClick}
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full h-12 w-12"
          >
            <User className="h-5 w-5" />
          </Button>
        )}
      </div>

      <PlaylistSelectionSheet
        videoId={videoId}
        isOpen={isPlaylistSheetOpen}
        onOpenChange={setIsPlaylistSheetOpen}
      />
    </>
  );
};
