import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRef } from 'react';
import { LikeButton } from './LikeButton';
import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'audio';
  thumbnail?: string;
  artist?: any;
  video_url?: string;
  audio_url?: string;
  duration?: number;
}

interface ContentCarouselProps {
  title: string;
  items: ContentItem[];
  onItemClick?: (item: ContentItem) => void;
}

export function ContentCarousel({ title, items, onItemClick }: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playTracks } = usePlayer();
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleItemClick = (item: ContentItem, index: number) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      const tracks = items.map(i => ({
        id: i.id,
        title: i.title,
        artist_name: i.artist?.display_name || 'Unknown Artist',
        artist_id: i.artist?.id || '',
        artist_slug: i.artist?.slug || '',
        thumbnail_url: i.thumbnail || '',
        video_url: i.video_url || i.audio_url || '',
        duration: i.duration || 0,
      }));
      
      playTracks(tracks, index);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-48 cursor-pointer group"
            onClick={() => handleItemClick(item, index)}
          >
            <div className="relative aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl text-muted-foreground">
                    {item.type === 'video' ? '🎥' : '🎵'}
                  </span>
                </div>
              )}
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <LikeButton contentId={item.id} contentType={item.type} size="sm" />
              </div>
            </div>

            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {item.artist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.artist?.slug) {
                    navigate(`/${item.artist.slug}`);
                  }
                }}
                className="text-sm text-muted-foreground hover:text-foreground truncate text-left w-full disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!item.artist?.slug}
              >
                {item.artist.display_name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
