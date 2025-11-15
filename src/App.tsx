import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { InstallBanner } from "@/components/InstallBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import ArtistRoute from "@/components/ArtistRoute";
import Portals from "./pages/Portals";
import ArtistPortal from "./pages/ArtistPortal";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Copyright from "./pages/Copyright";
import Profile from "./pages/Profile";
import Videos from "./pages/Videos";
import Audio from "./pages/Audio";
import Events from "./pages/Events";
import Merch from "./pages/Merch";
import Monetization from "./pages/Monetization";
import Payments from "./pages/Payments";
import PortPreview from "./pages/PortPreview";
import MemberPlaylists from "./pages/MemberPlaylists";
import EditPlaylist from "./pages/EditPlaylist";
import JukeboxPlayerPage from "./pages/JukeboxPlayerPage";
import Browse from "./pages/Browse";
import Port from "./pages/Port";
import NotFound from "./pages/NotFound";
import PWAStatus from "./pages/PWAStatus";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminMembership from "./pages/admin/AdminMembership";
import Watch from "./pages/Watch";
import Posts from "./pages/Posts";
import BecomeArtist from "./pages/BecomeArtist";
import ApplicationStatus from "./pages/ApplicationStatus";
import MemberDashboard from "./pages/MemberDashboard";
import MemberProfile from "./pages/MemberProfile";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminBlog from "./pages/admin/AdminBlog";
import SocialConsole from "./pages/SocialConsole";
import SocialAnalytics from "./pages/SocialAnalytics";
import SubClipLibrary from "./pages/SubClipLibrary";
import ProducerQueue from "./pages/ProducerQueue";
import OAuthCallback from "./pages/OAuthCallback";
import Streaming from "./pages/Streaming";
import Test from "./pages/Test";
import { useEffect } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { currentTrack, miniPlayerVisible } = usePlayer();

  // Track page views for all route changes
  usePageTracking();

  // App lifecycle management for session persistence
  useAppLifecycle({
    onAppActive: async () => {
      console.log("[App] App became active, verifying session...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("[App] Session active");
      } else {
        console.log("[App] No active session");
      }
    },
    onAppBackground: () => {
      console.log("[App] App going to background");
    }
  });

  // Add class to body when mini-player is active for proper spacing
  useEffect(() => {
    if (currentTrack && miniPlayerVisible) {
      document.body.classList.add('has-mini-player');
    } else {
      document.body.classList.remove('has-mini-player');
    }
  }, [currentTrack, miniPlayerVisible]);

  return (
    <>
      <MiniPlayer />
      {/* Install Banner - Native browser prompt without service workers */}
      <InstallBanner />
      <Routes>
          <Route path="/" element={<ArtistPortal />} />
          <Route path="/portals" element={<Portals />} />
          <Route path="/features" element={<Features />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/copyright" element={<Copyright />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/test" element={<Test />} />
          
          {/* Member Routes */}
          <Route path="/member/dashboard" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/member/profile" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
          <Route path="/become-artist" element={<ProtectedRoute><BecomeArtist /></ProtectedRoute>} />
          <Route path="/application-status" element={<ProtectedRoute><ApplicationStatus /></ProtectedRoute>} />
          
          {/* Artist Routes */}
          <Route path="/dashboard" element={<ArtistRoute><Dashboard /></ArtistRoute>} />
          <Route path="/profile" element={<ArtistRoute><Profile /></ArtistRoute>} />
          <Route path="/videos" element={<ArtistRoute><Videos /></ArtistRoute>} />
          <Route path="/audio" element={<ArtistRoute><Audio /></ArtistRoute>} />
          <Route path="/events" element={<ArtistRoute><Events /></ArtistRoute>} />
          <Route path="/streaming" element={<ArtistRoute><Streaming /></ArtistRoute>} />
          <Route path="/posts" element={<ArtistRoute><Posts /></ArtistRoute>} />
          <Route path="/merch" element={<ArtistRoute><Merch /></ArtistRoute>} />
          <Route path="/monetization" element={<ArtistRoute><Monetization /></ArtistRoute>} />
          <Route path="/payments" element={<ArtistRoute><Payments /></ArtistRoute>} />
          <Route path="/preview" element={<ArtistRoute><PortPreview /></ArtistRoute>} />
          <Route path="/artist-portal/social-console" element={<ArtistRoute><SocialConsole /></ArtistRoute>} />
          <Route path="/artist-portal/social-analytics" element={<ArtistRoute><SocialAnalytics /></ArtistRoute>} />
          <Route path="/artist-portal/subclip-library" element={<ArtistRoute><SubClipLibrary /></ArtistRoute>} />
          
          {/* Member Playlist Routes */}
          <Route path="/member/playlists" element={<ProtectedRoute><MemberPlaylists /></ProtectedRoute>} />
          <Route path="/member/playlists/:id/edit" element={<ProtectedRoute><EditPlaylist /></ProtectedRoute>} />
          <Route path="/member/playlists/:id/jukebox" element={<ProtectedRoute><JukeboxPlayerPage /></ProtectedRoute>} />
          <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
          <Route path="/admin/videos" element={<AdminRoute><AdminVideos /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
          <Route path="/admin/verification" element={<AdminRoute><AdminVerification /></AdminRoute>} />
          <Route path="/admin/membership" element={<AdminRoute><AdminMembership /></AdminRoute>} />
          <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
          <Route path="/admin/producer-queue" element={<AdminRoute><ProducerQueue /></AdminRoute>} />
          
          {/* Blog Routes */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          
          {/* OAuth Callback */}
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          
          <Route path="/watch" element={<Watch />} />
          <Route path="/pwa-status" element={<PWAStatus />} />
          <Route path="/:slug" element={<Port />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlayerProvider>
            <AppRoutes />
          </PlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
