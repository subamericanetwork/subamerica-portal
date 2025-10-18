import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import Profile from "./pages/Profile";
import Videos from "./pages/Videos";
import Events from "./pages/Events";
import Merch from "./pages/Merch";
import Monetization from "./pages/Monetization";
import Payments from "./pages/Payments";
import PortPreview from "./pages/PortPreview";
import Port from "./pages/Port";
import NotFound from "./pages/NotFound";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminPayments from "./pages/admin/AdminPayments";
import Watch from "./pages/Watch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/merch" element={<ProtectedRoute><Merch /></ProtectedRoute>} />
          <Route path="/monetization" element={<ProtectedRoute><Monetization /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/preview" element={<ProtectedRoute><PortPreview /></ProtectedRoute>} />
          <Route path="/admin/videos" element={<AdminRoute><AdminVideos /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/:slug" element={<Port />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
