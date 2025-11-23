import { ListMusic, Heart, UserCheck as UserPlus, Clock, Plus, Compass, Home as Sparkles, Radio, Play, User, LogOut, LayoutDashboard, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlaylist } from '@/hooks/usePlaylist';
import { SearchBar } from './SearchBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import subamericaLogo from '@/assets/subamerica-logo-small.jpg';

interface MemberSidebarProps {
  onNavigate?: () => void;
}

export function MemberSidebar({ onNavigate }: MemberSidebarProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { t } = useTranslation('member');
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
          onClick={() => handleNavigation('/member/home')}
        >
          <img src={subamericaLogo} alt="Subamerica" className="h-10 w-10 rounded-md object-cover" />
          <span className="text-xl font-bold">Subamerica</span>
        </div>

        <SearchBar />

        <Separator />

        <div className="space-y-2">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('sidebar.discover')}
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/home')}
          >
            <Sparkles className="h-4 w-4 mr-3" />
            {t('sidebar.home')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/live')}
          >
            <Radio className="h-4 w-4 mr-3" />
            {t('sidebar.live')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/watch')}
          >
            <Play className="h-4 w-4 mr-3" />
            {t('sidebar.videos')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/playlists')}
          >
            <ListMusic className="h-4 w-4 mr-3" />
            {t('sidebar.playlists')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/dashboard')}
          >
            <LayoutDashboard className="h-4 w-4 mr-3" />
            {t('sidebar.dashboard')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/portals')}
          >
            <Grid3x3 className="h-4 w-4 mr-3" />
            {t('sidebar.portals')}
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('sidebar.library')}
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/liked')}
          >
            <Heart className="h-4 w-4 mr-3" />
            {t('sidebar.liked')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/following')}
          >
            <UserPlus className="h-4 w-4 mr-3" />
            {t('sidebar.following')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/recent')}
          >
            <Clock className="h-4 w-4 mr-3" />
            {t('sidebar.recentlyPlayed')}
          </Button>

          <Button
            variant="default"
            className="w-full justify-start"
            onClick={() => handleNavigation('/member/playlists')}
          >
            <Plus className="h-4 w-4 mr-3" />
            {t('sidebar.createPlaylist')}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleNavigation('/browse')}
          >
            <Compass className="h-4 w-4 mr-3" />
            {t('sidebar.browse')}
          </Button>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-1">
          <h3 className="px-2 text-sm font-semibold text-muted-foreground mb-2">
            {t('playlists.myPlaylists')}
          </h3>
          {playlists.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">
              {t('playlists.empty')}
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
          {t('sidebar.account')}
        </h3>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation('/member/profile')}
        >
          <User className="h-4 w-4 mr-3" />
          {t('sidebar.profile')}
        </Button>
        
        <div className="px-2 py-2">
          <LanguageSwitcher />
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {t('common:nav.logout', { ns: 'common' })}
        </Button>
      </div>
    </div>
  );
}
