import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLikes } from '@/hooks/useLikes';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  contentId: string;
  contentType: 'video' | 'audio' | 'playlist';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export function LikeButton({ contentId, contentType, size = 'default', showLabel = false }: LikeButtonProps) {
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(contentId, contentType);

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'icon'}
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(contentId, contentType);
      }}
      className={cn(
        "transition-colors",
        liked && "text-primary"
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          size === 'lg' && "h-5 w-5",
          liked && "fill-current"
        )} 
      />
      {showLabel && <span className="ml-2">{liked ? 'Liked' : 'Like'}</span>}
    </Button>
  );
}
