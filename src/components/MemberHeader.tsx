import { useNavigate, useLocation } from "react-router-dom";
import { Home, Compass, Play, ListMusic, User, LogOut, LayoutDashboard, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";

export function MemberHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [hasPortalAccess, setHasPortalAccess] = useState(false);

  useEffect(() => {
    const checkPortalAccess = async () => {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('get_user_primary_role', {
        user_id_param: user.id
      });
      
      if (!error && data) {
        setHasPortalAccess(data === 'artist' || data === 'admin');
      }
    };

    checkPortalAccess();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const memberNavItems = [
    { title: "Discover", url: "/portals", icon: Compass },
    { title: "Watch", url: "/watch", icon: Play },
    { title: "Blog", url: "/blog", icon: BookOpen },
    { title: "Playlists", url: "/member/playlists", icon: ListMusic },
    { title: "Profile", url: "/member/profile", icon: User },
  ];

  return (
    <header className="fixed top-0 z-40 w-full border-b border-border bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: Logo + "Subamerica" */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={subamericaLogo} alt="Subamerica" className="h-8" />
          <span className="text-lg font-semibold">Subamerica</span>
        </div>
        
        {/* Right: Navigation Links */}
        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          {memberNavItems.map((item) => (
            <Button
              key={item.title}
              variant={isActive(item.url) ? "secondary" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2"
              onClick={() => navigate(item.url)}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Button>
          ))}
          
          {/* Portal Dashboard Link (Artists/Admins Only - Desktop) */}
          {hasPortalAccess && (
            <Button
              variant={isActive("/dashboard") ? "secondary" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2 !text-teal-500 hover:!text-teal-500 hover:!bg-teal-50/10"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Portal Dashboard
            </Button>
          )}
          
          {/* Mobile: Icons only */}
          {memberNavItems.map((item) => (
            <Button
              key={`mobile-${item.title}`}
              variant={isActive(item.url) ? "secondary" : "ghost"}
              size="sm"
              className="md:hidden"
              onClick={() => navigate(item.url)}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
          
          {/* Mobile Portal Dashboard Icon */}
          {hasPortalAccess && (
            <Button
              variant={isActive("/dashboard") ? "secondary" : "ghost"}
              size="sm"
              className="md:hidden !text-teal-500 hover:!text-teal-500"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          )}
          
          {/* Logout Button */}
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
      </div>
    </header>
  );
}
