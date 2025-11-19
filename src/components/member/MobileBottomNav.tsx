import { Home, Search, ListMusic, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();

  if (!isMobile) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/member/home' },
    { icon: Search, label: 'Search', path: '/browse' },
    { icon: ListMusic, label: 'Library', path: '/member/playlists' },
    { icon: User, label: 'Profile', path: '/member/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
            >
              <Icon 
                className={`h-6 w-6 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
              <span 
                className={`text-xs ${
                  active ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
