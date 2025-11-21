import { ListMusic, Heart, UserCheck, Clock, Plus, Compass, Home, Radio, Play, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { usePlaylist } from '@/hooks/usePlaylist';
import { SearchBar } from './SearchBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import subamericaLogo from '@/assets/subamerica-logo-small.jpg';

interface MemberSidebarProps {
  onNavigate?: () => void;
}

export function MemberSidebar({ onNavigate }: MemberSidebarProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { playlists } = usePlaylist();
  const { signOut } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    onNavigate?.();
  };

  return (
    <div className={isMobile ? "w-full" : "w-80 border-r"} style={{ backgroundColor: 'hsl(var(--card))' }} data-class="bg-card flex flex-col h-full">
      <div className="p-4 space-y-4">
        <div 
          className="flex items-center gap-3 px-2 py-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleNavigation('/member')}
        >
          <img src={subamericaLogo} alt="Subamerica" className="h-10 w-10 rounded-md object-cover" />
          <span className="text-xl font-bold">Subamerica</span>
        </div>

        <SearchBar />

        <Separator />

        <div className="space-y-2">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member')}
          >
            <Home className="h-4 w-4 mr-3" />
            Discover
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/live')}
          >
            <Radio className="h-4 w-4 mr-3" />
            Live
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/watch')}
          >
            <Play className="h-4 w-4 mr-3" />
            Watch TV
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/playlists')}
          >
            <ListMusic className="h-4 w-4 mr-3" />
            Playlists
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Library
          </h3>
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

          <Button
            variant="default"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/playlists')}
          >
            <Plus className="h-4 w-4 mr-3" />
            Create Playlist
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleNavigation('/browse')}
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
                onClick={() => handleNavigation(`/member/playlists/${playlist.id}/jukebox`)}
              >
                <ListMusic className="h-4 w-4 mr-3" />
                <span className="truncate">{playlist.name}</span>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4 space-y-2">
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Account
        </h3>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation('/member/profile')}
        >
          <User className="h-4 w-4 mr-3" />
          Profile
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
