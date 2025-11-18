import { Button } from '@/components/ui/button';
import { Play, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { FollowButton } from './FollowButton';

interface FeaturedArtistHeroProps {
  artist: any;
}

export function FeaturedArtistHero({ artist }: FeaturedArtistHeroProps) {
  const navigate = useNavigate();

  if (!artist) return null;

  return (
    <div className="relative h-96 rounded-lg overflow-hidden bg-gradient-to-b from-primary/20 to-background">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      <div className="relative h-full flex items-end p-8">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">Featured Artist</span>
            {artist.is_verified && <VerifiedBadge />}
          </div>
          
          <h1 className="text-6xl font-bold">{artist.display_name}</h1>
          
          {artist.bio_short && (
            <p className="text-lg text-muted-foreground line-clamp-2">
              {artist.bio_short}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate(`/${artist.slug}`)}
              className="rounded-full"
            >
              <Play className="h-5 w-5 mr-2" />
              Visit Port
            </Button>
            
            <FollowButton artistId={artist.id} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
