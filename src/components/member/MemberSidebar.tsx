import { ListMusic, Heart, UserCheck, Clock, Plus, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { usePlaylist } from '@/hooks/usePlaylist';
import { SearchBar } from './SearchBar';

export function MemberSidebar() {
  const navigate = useNavigate();
  const { playlists } = usePlaylist();

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      <div className="p-4 space-y-4">
        <SearchBar />

        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate('/member/playlists')}
          >
            <ListMusic className="h-4 w-4 mr-3" />
            Your Playlists
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
          >
            <Heart className="h-4 w-4 mr-3" />
            Liked Content
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
          >
            <UserCheck className="h-4 w-4 mr-3" />
            Following
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
          >
            <Clock className="h-4 w-4 mr-3" />
            Recently Played
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Button
            variant="default"
            className="w-full justify-start"
            onClick={() => navigate('/member/playlists')}
          >
            <Plus className="h-4 w-4 mr-3" />
            Create Playlist
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/browse')}
          >
            <Compass className="h-4 w-4 mr-3" />
            Browse Catalog
          </Button>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-1">
          <h3 className="px-2 text-sm font-semibold text-muted-foreground mb-2">
            Your Playlists
          </h3>
          {playlists.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">
              No playlists yet
            </p>
          ) : (
            playlists.map((playlist) => (
              <Button
                key={playlist.id}
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => navigate(`/member/playlists/${playlist.id}/jukebox`)}
              >
                <ListMusic className="h-4 w-4 mr-3" />
                <span className="truncate">{playlist.name}</span>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
