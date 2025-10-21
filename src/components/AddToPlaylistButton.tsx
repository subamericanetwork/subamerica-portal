import { useState } from 'react';
import { Button } from '@/components/ui/button';
import subamericaLogo from '@/assets/subamerica-logo-small.jpg';
import { PlaylistSelectionSheet } from './PlaylistSelectionSheet';

interface AddToPlaylistButtonProps {
  videoId: string;
  className?: string;
  variant?: 'overlay' | 'inline';
}

export const AddToPlaylistButton = ({ 
  videoId, 
  className = '',
  variant = 'overlay'
}: AddToPlaylistButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'overlay') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`absolute bottom-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
          aria-label="Add to playlist"
        >
          <img 
            src={subamericaLogo} 
            alt="Add to playlist" 
            className="h-6 w-6 rounded-full"
          />
        </button>
        <PlaylistSelectionSheet 
          videoId={videoId}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`gap-2 ${className}`}
      >
        <img 
          src={subamericaLogo} 
          alt="" 
          className="h-4 w-4 rounded-full"
        />
        Add to Playlist
      </Button>
      <PlaylistSelectionSheet 
        videoId={videoId}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
};
