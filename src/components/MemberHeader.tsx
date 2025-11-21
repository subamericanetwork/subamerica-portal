import { useNavigate, useLocation, Link } from "react-router-dom";
import { Home, Compass, Play, Radio, ListMusic, User, LogOut, LayoutDashboard, BookOpen, Calendar, Clock, Music, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MemberSidebar } from "@/components/member/MemberSidebar";

interface ActiveStream {
  id: string;
  title: string;
  status: string;
}

export function MemberHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const [hasPortalAccess, setHasPortalAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [artist, setArtist] = useState<{ id: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { title: "Discover", url: "/member", icon: Home },
    { title: "Live", url: "/member/live", icon: Radio },
    { title: "Watch TV", url: "/watch", icon: Play },
    { title: "Playlists", url: "/member/playlists", icon: ListMusic },
  ];

  return (
    <header className="fixed top-0 z-40 w-full border-b border-border bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Hamburger Menu - Mobile Only */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <MemberSidebar onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        )}

        {/* Left: Logo + "Subamerica" */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={subamericaLogo} alt="Subamerica" className="h-8" />
          <span className="text-lg font-semibold">Subamerica</span>
        </div>
        
        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          {/* Desktop - Profile & Logout */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={isActive("/member/profile") ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => navigate("/member/profile")}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile - Logout Only */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
