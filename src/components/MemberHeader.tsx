import { useNavigate, useLocation, Link } from "react-router-dom";
import { Home, Compass, Play, Radio, ListMusic, User, LogOut, LayoutDashboard, BookOpen, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";
import { cn } from "@/lib/utils";

interface ActiveStream {
  id: string;
  title: string;
  status: string;
}

export function MemberHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [hasPortalAccess, setHasPortalAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [artist, setArtist] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const checkPortalAccess = async () => {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('get_user_primary_role', {
        user_id_param: user.id
      });
      
      if (!error && data) {
        setHasPortalAccess(data === 'artist' || data === 'admin');
        setIsAdmin(data === 'admin');
      }

      // Get artist ID
      const { data: artistData } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (artistData) {
        setArtist(artistData);
      }
    };

    checkPortalAccess();
  }, [user]);

  useEffect(() => {
    if (artist?.id) {
      checkActiveStream();
      
      const channel = supabase
        .channel('active-stream')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'artist_live_streams',
            filter: `artist_id=eq.${artist.id}`
          },
          () => {
            checkActiveStream();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [artist?.id]);

  const checkActiveStream = async () => {
    if (!artist?.id) return;

    // Check for live streams
    const { data: liveData } = await supabase
      .from('artist_live_streams')
      .select('id, title, status')
      .eq('artist_id', artist.id)
      .eq('status', 'live')
      .order('started_at', { ascending: false })
      .limit(1);

    if (liveData && liveData.length > 0) {
      setActiveStream(liveData[0] as ActiveStream);
    } else {
      setActiveStream(null);
    }

    // Check for scheduled streams
    const { data: scheduledData } = await supabase
      .from('artist_live_streams')
      .select('id')
      .eq('artist_id', artist.id)
      .in('status', ['scheduled', 'waiting']);

    setScheduledCount(scheduledData?.length || 0);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const memberNavItems = [
    { title: "Home", url: "/member/home", icon: Home },
    { title: "Discover", url: "/portals", icon: Compass },
    { title: "Live", url: "/live", icon: Radio },
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
          
          {/* Live/Scheduled Status - Desktop */}
          {hasPortalAccess && activeStream && (
            <Button
              variant="destructive"
              size="sm"
              className="hidden md:flex gap-2 animate-pulse bg-red-600 hover:bg-red-700"
              onClick={() => navigate("/streaming")}
            >
              <Radio className="h-4 w-4" />
              LIVE
            </Button>
          )}
          
          
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
          
          {/* Live Now Button - Mobile */}
          {activeStream && (
            <Button
              variant="destructive"
              size="sm"
              className="md:hidden animate-pulse bg-red-600 hover:bg-red-700"
              onClick={() => navigate("/streaming")}
            >
              <Radio className="h-4 w-4" />
            </Button>
          )}
          
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
          
          {/* Mobile Stream Schedule Icon */}
          {isAdmin && (
            <Button
              variant={isActive("/admin/stream-schedule") ? "secondary" : "ghost"}
              size="sm"
              className="md:hidden"
              onClick={() => navigate("/admin/stream-schedule")}
            >
              <Calendar className="h-4 w-4" />
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
