import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Video, 
  Calendar, 
  ShoppingBag, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Info,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Package,
  HeartHandshake,
  Music,
  Radio
} from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { SocialMediaReachCard } from "@/components/SocialMediaReachCard";
import { useSocialStats } from "@/hooks/useSocialStats";
import { SEOCompleteness } from "@/components/SEOCompleteness";
import { useToast } from "@/hooks/use-toast";


interface Tip {
  id: string;
  created_at: string;
  amount: number;
  artist_share: number;
  tipper_email: string;
}

interface Order {
  id: string;
  created_at: string;
  customer_email: string;
  product_name: string;
  total_amount: number;
}

interface ActiveStream {
  id: string;
  title: string;
  started_at: string;
  viewer_count: number;
  status: string;
}

const Dashboard = () => {
  const { artist, videos, events, products, audioTracks, portSettings, loading, surfaceProducts, featuredVideo, featuredAudio, faqs } = useArtistData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const { stats: socialStats, loading: socialStatsLoading } = useSocialStats(artist?.id);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);
  const [streamDuration, setStreamDuration] = useState<string>("");

  useEffect(() => {
    checkArtistRole();
  }, [user]);

  useEffect(() => {
    if (artist) {
      fetchPaymentData();
      checkActiveStream();
    }
  }, [artist]);

  useEffect(() => {
    if (!artist) return;

    // Subscribe to real-time stream updates
    const channel = supabase
      .channel('dashboard-stream-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artist_live_streams',
          filter: `artist_id=eq.${artist.id}`
        },
        (payload) => {
          const stream = payload.new as ActiveStream;
          if (stream.status === 'live') {
            setActiveStream(stream);
          } else {
            setActiveStream(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artist]);

  useEffect(() => {
    if (!activeStream?.started_at) return;

    const updateDuration = () => {
      const start = new Date(activeStream.started_at);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setStreamDuration(`${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [activeStream]);

  const checkActiveStream = async () => {
    if (!artist) return;

    const { data: stream } = await supabase
      .from('artist_live_streams')
      .select('id, title, started_at, viewer_count, status')
      .eq('artist_id', artist.id)
      .eq('status', 'live')
      .single();

    setActiveStream(stream);
  };

  const checkArtistRole = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'artist'
      });

      if (!roleData) {
        navigate("/member/dashboard");
        return;
      }
    } catch (error) {
      console.error("Error checking artist role:", error);
      navigate("/member/dashboard");
    } finally {
      setCheckingRole(false);
    }
  };

  const fetchPaymentData = async () => {
    if (!artist) return;
    
    try {
      // Fetch tips
      const { data: tipsData } = await supabase
        .from("tips")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setTips((tipsData || []) as Tip[]);

      // Fetch orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setOrders((ordersData || []) as Order[]);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  if (loading || checkingRole) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your Port...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!artist) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <p>Artist profile not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isPublished = portSettings?.publish_status === 'published';
  const hasProfile = artist.display_name && artist.email;
  const hasContent = videos.length > 0 || events.length > 0 || products.length > 0;
  const hasPreviewedPort = true; // Could track this in user preferences
  
  // Calculate setup progress
  const setupSteps = [
    { label: "Complete profile", completed: hasProfile },
    { label: "Add content", completed: hasContent },
    { label: "Customize Port", completed: hasContent },
    { label: "Preview Port", completed: hasPreviewedPort },
    { label: "Publish Port", completed: isPublished },
  ];
  const completedSteps = setupSteps.filter(s => s.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  // Calculate earnings
  const totalTips = tips.reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingTips = tips.filter(t => t.artist_share).reduce((sum, t) => sum + Number(t.artist_share), 0);
  const totalOrders = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Recent activity (combined tips and orders)
  const recentActivity = [
    ...tips.map(t => ({ type: 'tip', date: t.created_at, description: `Tip from ${t.tipper_email}`, amount: t.amount })),
    ...orders.map(o => ({ type: 'order', date: o.created_at, description: `Order: ${o.product_name}`, amount: o.total_amount }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Upcoming events
  const upcomingEvents = events
    .filter(e => new Date(e.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 1);

  const isNewUser = videos.length === 0 && events.length === 0 && products.length === 0;

  const handlePurchaseStreamingTime = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('purchase-streaming-time', {
        body: { artist_id: artist.id }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: "Opening checkout...",
          description: "Complete your purchase to add 1 hour of streaming time"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive"
      });
    }
  };

  const handleUpgradeToTrident = async () => {
    try {
      toast({
        title: "Upgrade to Trident! 🔱",
        description: "Contact support to upgrade and get 50% off your first month"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start upgrade",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Active Stream Alert */}
        {activeStream && (
          <Alert className="border-red-500 bg-red-500/10">
            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-lg mb-1">
                  🔴 You're Live! {activeStream.title}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {streamDuration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {activeStream.viewer_count || 0} viewers
                  </span>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/streaming")}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                Go to Stream Controls
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                {greeting}, {artist.display_name}
                {isNewUser && <Sparkles className="h-6 w-6 text-yellow-500" />}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isNewUser 
                  ? "Welcome to your Artist Portal! Let's get you set up." 
                  : "Here's what's happening with your Port"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={isPublished ? "border-green-500/50 bg-green-500/10" : "border-yellow-500/50 bg-yellow-500/10"}>
                {isPublished ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Published
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Draft
                  </>
                )}
              </Badge>
              <Button onClick={() => navigate("/preview")} className="gap-2">
                <Eye className="h-4 w-4" />
                Preview Port
              </Button>
            </div>
          </div>

          {/* Setup Progress for New Users */}
          {!isPublished && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Get Started
                    </CardTitle>
                    <CardDescription>
                      Complete these steps to launch your Port
                    </CardDescription>
                  </div>
                  <span className="text-2xl font-bold text-primary">{completedSteps}/{setupSteps.length}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPercentage} className="h-2" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {setupSteps.map((step, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        step.completed 
                          ? 'border-green-500/30 bg-green-500/10' 
                          : 'border-border bg-muted/50'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${step.completed ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${((totalTips + totalOrders) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/payments")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Payout
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(pendingTips / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your 80% share
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/payments")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tips Received
                </CardTitle>
                <HeartHandshake className="h-4 w-4 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tips.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total donations
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/payments")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Product Orders
                </CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total sales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Reach */}
        <SocialMediaReachCard stats={socialStats} loading={socialStatsLoading} />

        {/* SEO Discovery Optimization */}
        {artist && (
          <SEOCompleteness
            artist={artist}
            faqs={faqs}
            portSettings={portSettings}
          />
        )}

        {/* Content Stats & Port Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Content Stats */}
          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/videos")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videos.length}</div>
              <p className="text-xs text-muted-foreground">
                {featuredVideo ? "1 featured" : "No featured video"}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/audio")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Audio Tracks</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audioTracks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {featuredAudio ? "1 featured" : "No featured track"}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/events")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <p className="text-xs text-muted-foreground">
                Next 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/merch")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Merch on Port</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{surfaceProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                Products visible
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Streaming Usage Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Streaming Usage
              {artist?.subscription_tier === 'trident' && (
                <Badge variant="default" className="ml-2">🔱 Trident</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {artist?.subscription_tier === 'trident'
                ? 'Your monthly livestreaming allowance'
                : 'Upgrade to Trident to go live'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {artist?.subscription_tier === 'trident' ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hours Used</span>
                    <span className="font-medium">
                      {Math.floor((artist.streaming_minutes_used || 0) / 60)}h {(artist.streaming_minutes_used || 0) % 60}m of 10h
                    </span>
                  </div>
                  <Progress 
                    value={((artist.streaming_minutes_used || 0) / 600) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.floor((600 - (artist.streaming_minutes_used || 0)) / 60)}h {(600 - (artist.streaming_minutes_used || 0)) % 60}m
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Remaining this month
                    </p>
                  </div>
                  
                  {(600 - (artist.streaming_minutes_used || 0)) < 120 && (
                    <Alert variant="default" className="max-w-xs">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Less than 2 hours remaining
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Resets on: {artist.last_streaming_reset ? format(new Date(new Date(artist.last_streaming_reset).setMonth(new Date(artist.last_streaming_reset).getMonth() + 1)), 'MMMM 1, yyyy') : 'N/A'}
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handlePurchaseStreamingTime}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Buy 1 Hour ($15)
                  </Button>
                  
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/streaming')}
                    disabled={(600 - (artist.streaming_minutes_used || 0)) <= 0}
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Go Live Now
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Radio className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Livestreaming Locked</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Trident to go live and connect with your audience in real-time.
                </p>
                <ul className="text-sm text-left mb-6 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>10 hours of livestreaming per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Guaranteed OTT broadcast rotation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Unlimited video uploads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>3 Muse Coins per month</span>
                  </li>
                </ul>
                
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
                  <Badge variant="default" className="mb-2">
                    🎉 Limited Time Offer
                  </Badge>
                  <p className="text-lg font-bold">
                    50% off your first month!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Only $49.50 for your first month (then $99/mo)
                  </p>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleUpgradeToTrident}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Trident
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout: Recent Activity + Content Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-xs mt-2">Tips and orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      {activity.type === 'tip' ? (
                        <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                          <HeartHandshake className="h-5 w-5 text-pink-500" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-blue-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        +${(activity.amount / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    onClick={() => navigate("/payments")}
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Previews */}
          <div className="space-y-4">
            {/* Featured Video Preview */}
            {featuredVideo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Featured Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center mb-3 overflow-hidden">
                    {featuredVideo.thumb_url ? (
                      <img 
                        src={featuredVideo.thumb_url} 
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{featuredVideo.title}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 gap-2" 
                    onClick={() => navigate("/videos")}
                  >
                    Manage Videos
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Next Event Preview */}
            {upcomingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Next Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{upcomingEvents[0].title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(upcomingEvents[0].starts_at), 'MMM d, yyyy - h:mm a')}
                    </div>
                    {upcomingEvents[0].venue && (
                      <p className="text-sm text-muted-foreground">{upcomingEvents[0].venue}</p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 gap-2" 
                    onClick={() => navigate("/events")}
                  >
                    Manage Events
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Top Product Preview */}
            {surfaceProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Featured Merch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{surfaceProducts[0].title}</p>
                    {surfaceProducts[0].price && (
                      <p className="text-lg font-bold text-primary">
                        ${Number(surfaceProducts[0].price).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 gap-2" 
                    onClick={() => navigate("/merch")}
                  >
                    Manage Merch
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your Port</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-start gap-2 hover:border-primary/50 transition-smooth" 
              onClick={() => navigate("/videos")}
            >
              <Video className="h-6 w-6 text-primary" />
              <span className="font-semibold text-base">Upload Video</span>
              <span className="text-xs text-muted-foreground text-left">Add music videos, performances</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-start gap-2 hover:border-primary/50 transition-smooth" 
              onClick={() => navigate("/events")}
            >
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-semibold text-base">Create Event</span>
              <span className="text-xs text-muted-foreground text-left">Promote upcoming shows</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-start gap-2 hover:border-primary/50 transition-smooth" 
              onClick={() => navigate("/merch")}
            >
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="font-semibold text-base">Add Merch</span>
              <span className="text-xs text-muted-foreground text-left">Surface products on your Port</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
