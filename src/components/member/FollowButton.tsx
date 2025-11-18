import { Button } from '@/components/ui/button';
import { useFollows } from '@/hooks/useFollows';
import { UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  artistId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function FollowButton({ artistId, variant = 'outline', size = 'default' }: FollowButtonProps) {
  const { isFollowing, toggleFollow } = useFollows();
  const following = isFollowing(artistId);

  return (
    <Button
      variant={following ? 'secondary' : variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        toggleFollow(artistId);
      }}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}
