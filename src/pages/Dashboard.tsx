import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Video, Calendar, ShoppingBag, Eye, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { artist, videos, events, products, portSettings, loading, surfaceProducts, featuredVideo } = useArtistData();
  const navigate = useNavigate();

  if (loading) {
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
  const videosWithoutCaptions = videos.filter(v => v.is_featured && !v.captions_url).length;
  const portHealth = Math.round((1 - (videosWithoutCaptions / Math.max(videos.length, 1))) * 100);

  return (
    <DashboardLayout>
      <TooltipProvider>
      <div className="p-8 space-y-8">
        {/* Welcome Banner for First-Time Users */}
        {videos.length === 0 && events.length === 0 && products.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Welcome to your Artist Portal! Get started by adding videos, events, or merch. Once you're ready, preview and publish your Port to make it live.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {artist.display_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={isPublished ? "border-primary/50" : "border-yellow-500/50"}>
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
            <Button onClick={() => navigate("/preview")}>Preview Port</Button>
          </div>
        </div>

        {/* Port Status */}
        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Port Status</CardTitle>
                <CardDescription>Your public artist page</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Your Port is your public page. Draft mode keeps it private until you're ready to publish.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge variant="outline" className={isPublished ? "border-primary/50" : "border-yellow-500/50"}>
                  {isPublished ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Published - Live
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Draft - Not Public
                    </>
                  )}
                </Badge>
              </div>
              <Button onClick={() => navigate("/preview")}>
                {isPublished ? 'Manage Port' : 'Publish Port'}
              </Button>
            </div>
            
            {isPublished && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Your Port URL</p>
                  <p className="text-lg font-mono text-primary">
                    subamerica.net/port/{artist.slug}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(`subamerica.net/port/${artist.slug}`);
                }}>
                  Copy Link
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">Port Views (30d)</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">Click-through Rate</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">QR Scans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/events")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                Upcoming shows
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-smooth" onClick={() => navigate("/merch")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Merch Items</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{surfaceProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                Surface on Port
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Port Health</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Measures your Port's completeness based on accessibility requirements like video captions.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portHealth >= 90 ? 'text-green-500' : portHealth >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                {portHealth}%
              </div>
              <p className="text-xs text-muted-foreground">
                {portHealth >= 90 ? 'Ready to publish' : 'Needs attention'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        {videosWithoutCaptions > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
              <CardDescription>Complete these to optimize your Port</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Add captions to featured video</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for accessibility and publishing
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/videos")}>
                  Fix Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your Port</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start" onClick={() => navigate("/videos")}>
              <Video className="h-5 w-5 mb-2" />
              <span className="font-semibold">Upload Video</span>
              <span className="text-xs text-muted-foreground">Add music videos, performances</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start" onClick={() => navigate("/events")}>
              <Calendar className="h-5 w-5 mb-2" />
              <span className="font-semibold">Add Event</span>
              <span className="text-xs text-muted-foreground">Promote upcoming shows</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start" onClick={() => navigate("/merch")}>
              <ShoppingBag className="h-5 w-5 mb-2" />
              <span className="font-semibold">Add Merch</span>
              <span className="text-xs text-muted-foreground">Surface products on your Port</span>
            </Button>
          </CardContent>
        </Card>
      </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default Dashboard;
