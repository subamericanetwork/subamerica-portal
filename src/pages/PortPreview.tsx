import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Calendar, ShoppingBag, PlayCircle, Heart, Users, MapPin, Instagram, Music2, Info, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Facebook, Twitter, Youtube, Linkedin, Globe, Share2 } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PortPreview = () => {
  const { artist, videos, events, surfaceProducts, featuredVideo, loading, portSettings } = useArtistData();
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!artist) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No Artist Profile Found</h3>
              <p className="text-muted-foreground">Please complete your profile to preview your Port</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleOpenInNewTab = () => {
    window.open(`${window.location.origin}/${artist.slug}`, '_blank');
  };

  const handlePublish = async () => {
    if (!artist) return;
    
    setIsPublishing(true);
    try {
      const newStatus = portSettings?.publish_status === 'published' ? 'draft' : 'published';
      
      const { error } = await supabase
        .from('port_settings')
        .upsert({
          artist_id: artist.id,
          publish_status: newStatus
        });

      if (error) throw error;

      toast.success(newStatus === 'published' ? 'Port published!' : 'Port unpublished');
      window.location.reload();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    } finally {
      setIsPublishing(false);
    }
  };

  const isPublished = portSettings?.publish_status === 'published';
  const hasContent = videos.length > 0 || events.length > 0 || surfaceProducts.length > 0;

  const artistImages = artist?.brand?.images || [];
  
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? Math.max(0, artistImages.length - 2) : prev - 1
    );
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev >= artistImages.length - 2 ? 0 : prev + 1
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Port Preview</h1>
            <p className="text-muted-foreground mt-1">
              Preview how your Port appears to fans
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isPublished ? "default" : "outline"} className={isPublished ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}>
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
            <Button variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublished ? 'Unpublish' : 'Publish Port'}
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {isPublished ? (
              <p><strong>Your Port is live!</strong> It's publicly accessible at subamerica.net/port/{artist.slug}. Any changes you make will appear immediately.</p>
            ) : (
              <div className="space-y-1">
                <p><strong>Preview Mode:</strong> Your Port is currently in draft mode and not visible to the public.</p>
                {!hasContent && <p className="text-yellow-500">⚠️ Add at least one video, event, or merch item before publishing.</p>}
                {hasContent && <p className="text-green-500">✓ Ready to publish! Click "Publish Port" when you're ready to go live.</p>}
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Port Preview */}
        <div className="max-w-5xl mx-auto space-y-8 p-8 border border-primary/20 rounded-lg bg-gradient-to-b from-card to-background">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center overflow-hidden">
              {artist.brand?.profile_photo ? (
                <img 
                  src={artist.brand.profile_photo} 
                  alt={artist.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-primary">
                  {artist.display_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div>
              <h1 className="text-5xl font-bold mb-2">{artist.display_name}</h1>
              {artist.scene && (
                <p className="text-xl text-primary">{artist.scene}</p>
              )}
              {artist.bio_short && (
                <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                  {artist.bio_short}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" className="glow-primary">
                <Heart className="h-4 w-4 mr-2" />
                Tip Artist
              </Button>
              <Button size="lg" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Join Subclub
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('videos')?.scrollIntoView({ behavior: 'smooth' })}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Videos
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Gallery
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}>
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('merch')?.scrollIntoView({ behavior: 'smooth' })}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Merch
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}>
                <Share2 className="h-4 w-4 mr-2" />
                Socials
              </Button>
            </div>
          </div>

          {/* Featured Video */}
          {featuredVideo && featuredVideo.video_url && (
            <div id="videos">
              <Card className="overflow-hidden gradient-card">
                <video 
                  controls 
                  className="w-full aspect-video"
                  poster={featuredVideo.thumb_url || undefined}
                >
                  <source src={featuredVideo.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{featuredVideo.title}</h3>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Image Gallery */}
          {artistImages.length > 0 && (
            <div className="space-y-4" id="gallery">
              <h2 className="text-2xl font-bold">Gallery</h2>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {artistImages.slice(currentImageIndex, currentImageIndex + 2).map((image: string, idx: number) => (
                    <Card key={currentImageIndex + idx} className="gradient-card overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        <img 
                          src={image} 
                          alt={`Gallery image ${currentImageIndex + idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
                
                {artistImages.length > 2 && (
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevImage}
                      className="rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentImageIndex + 1}-{Math.min(currentImageIndex + 2, artistImages.length)} of {artistImages.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextImage}
                      className="rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div className="space-y-4" id="events">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              <div className="grid gap-4">
                {events.map((event) => (
                  <Card key={event.id} className="gradient-card">
                  <CardContent className="p-4 flex gap-4">
                      <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {event.poster_url ? (
                          <img 
                            src={event.poster_url} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(event.starts_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {event.venue && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.venue}</span>
                          </div>
                        )}
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        {event.ticket_url && (
                          <Button size="sm" className="mt-2" asChild>
                            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                              Get Tickets
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Merch */}
          {surfaceProducts.length > 0 && (
            <div className="space-y-4" id="merch">
              <h2 className="text-2xl font-bold">Merch</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {surfaceProducts.map((product) => (
                  <Card key={product.id} className="gradient-card overflow-hidden">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  <CardContent className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm">{product.title}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                      )}
                      {product.price && (
                        <p className="text-sm text-primary font-bold">${product.price}</p>
                      )}
                      {product.link && (
                        <Button size="sm" variant="outline" className="w-full" asChild>
                          <a href={product.link} target="_blank" rel="noopener noreferrer">
                            View Product
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Footer with Social Links */}
          <footer id="footer" className="border-t border-border pt-8 mt-16">
            <div className="text-center space-y-4">
              {artist.socials && Object.keys(artist.socials).filter(key => artist.socials[key]).length > 0 && (
                <div className="flex items-center justify-center gap-4 py-2">
                  {Object.entries(artist.socials).map(([platform, url]) => {
                    const getSocialIcon = () => {
                      switch(platform.toLowerCase()) {
                        case 'instagram': return <Instagram className="h-4 w-4" />;
                        case 'facebook': return <Facebook className="h-4 w-4" />;
                        case 'twitter': case 'x': return <Twitter className="h-4 w-4" />;
                        case 'youtube': return <Youtube className="h-4 w-4" />;
                        case 'linkedin': return <Linkedin className="h-4 w-4" />;
                        case 'spotify': case 'soundcloud': case 'apple music': return <Music2 className="h-4 w-4" />;
                        case 'website': return <Globe className="h-4 w-4" />;
                        default: return <ExternalLink className="h-4 w-4" />;
                      }
                    };
                    
                    return url && (
                      <a 
                        key={platform}
                        href={url as string} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-smooth capitalize text-sm font-medium"
                      >
                        {getSocialIcon()}
                        <span>{platform}</span>
                      </a>
                    );
                  })}
                </div>
              )}
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {artist.display_name}</p>
            </div>
          </footer>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortPreview;
