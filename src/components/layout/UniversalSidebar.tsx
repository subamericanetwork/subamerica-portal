import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Tv,
  Radio,
  FileText,
  Sparkles,
  LogIn,
  UserPlus,
  Music,
  Heart,
  ListMusic,
  Users,
  Clock,
  Plus,
  Search,
  User,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlaylist } from "@/hooks/usePlaylist";

interface UniversalSidebarProps {
  onNavigate?: () => void;
}

export function UniversalSidebar({ onNavigate }: UniversalSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { playlists } = usePlaylist();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    onNavigate?.();
  };

  // Anonymous user navigation
  const anonymousItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Tv, label: "Watch TV", path: "/watch" },
    { icon: Radio, label: "Live", path: "/live" },
    { icon: FileText, label: "Blog", path: "/blog" },
    { icon: Sparkles, label: "Features", path: "/features" },
  ];

  const anonymousAuthItems = [
    { icon: LogIn, label: "Login", path: "/auth" },
    { icon: UserPlus, label: "Get Started", path: "/auth?tab=signup" },
  ];

  // Member user navigation
  const memberItems = [
    { icon: Home, label: "Discover", path: "/member/home" },
    { icon: Radio, label: "Live", path: "/live" },
    { icon: Tv, label: "Watch TV", path: "/watch" },
    { icon: ListMusic, label: "Playlists", path: "/member/playlists" },
    { icon: Heart, label: "Liked", path: "/member/liked" },
    { icon: Users, label: "Following", path: "/member/following" },
    { icon: Clock, label: "Recently Played", path: "/member/recent" },
    { icon: Plus, label: "Create Playlist", action: "create-playlist" },
    { icon: Search, label: "Browse Catalog", path: "/browse" },
  ];

  const memberAccountItems = [
    { icon: User, label: "Profile", path: "/member/profile" },
    { icon: LogOut, label: "Logout", action: "logout" },
  ];

  const handleCreatePlaylist = () => {
    // This will be handled by the playlist hook
    navigate("/member/playlists");
    onNavigate?.();
  };

  if (!user) {
    // Anonymous sidebar
    return (
      <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
        <SidebarContent>
          {/* Logo */}
          <div className="p-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <img src="/subamerica-logo-small.jpg" alt="Subamerica" className="w-8 h-8 rounded" />
                <span className="font-bold text-lg">Subamerica</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {anonymousItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.path)}
                      isActive={isActive(item.path)}
                      tooltip={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator />

          {/* Auth Items */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {anonymousAuthItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.path)}
                      isActive={isActive(item.path)}
                      tooltip={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Member sidebar
  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/subamerica-logo-small.jpg" alt="Subamerica" className="w-8 h-8 rounded" />
              <span className="font-bold text-lg">Subamerica</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Search (if not collapsed) */}
        {!collapsed && (
          <div className="px-3 py-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleNavigate("/browse")}
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberItems.map((item) => (
                <SidebarMenuItem key={item.path || item.action}>
                  <SidebarMenuButton
                    onClick={() => {
                      if (item.action === "create-playlist") {
                        handleCreatePlaylist();
                      } else if (item.path) {
                        handleNavigate(item.path);
                      }
                    }}
                    isActive={item.path ? isActive(item.path) : false}
                    tooltip={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Playlists */}
        {playlists.length > 0 && !collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>My Playlists</SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-48">
                <SidebarMenu>
                  {playlists.map((playlist) => (
                    <SidebarMenuItem key={playlist.id}>
                      <SidebarMenuButton
                        onClick={() => handleNavigate(`/member/playlists/${playlist.id}/jukebox`)}
                        isActive={location.pathname.includes(playlist.id)}
                      >
                        <Music className="h-4 w-4" />
                        <span className="truncate">{playlist.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Separator />

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberAccountItems.map((item) => (
                <SidebarMenuItem key={item.path || item.action}>
                  <SidebarMenuButton
                    onClick={() => {
                      if (item.action === "logout") {
                        handleLogout();
                      } else if (item.path) {
                        handleNavigate(item.path);
                      }
                    }}
                    isActive={item.path ? isActive(item.path) : false}
                    tooltip={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
