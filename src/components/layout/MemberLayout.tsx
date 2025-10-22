import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Compass, Play, ListMusic, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface MemberLayoutProps {
  children: ReactNode;
}

const memberNavItems = [
  { title: "Home", url: "/member/dashboard", icon: Home },
  { title: "Discover", url: "/portals", icon: Compass },
  { title: "Watch", url: "/watch", icon: Play },
  { title: "Playlists", url: "/member/playlists", icon: ListMusic },
  { title: "Profile", url: "/member/profile", icon: User },
];

export function MemberLayout({ children }: MemberLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <nav className="flex items-center gap-1">
            {memberNavItems.map((item) => (
              <Button
                key={item.title}
                variant={isActive(item.url) ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => navigate(item.url)}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.title}</span>
              </Button>
            ))}
          </nav>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
