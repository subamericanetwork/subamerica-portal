import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useMediaTracking } from "@/hooks/useMediaTracking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PortFooterActions } from "@/components/PortFooterActions";
import { ProductDialog } from "@/components/ProductDialog";
import { FAQSection } from "@/components/FAQSection";
import { PortSocialStats } from "@/components/PortSocialStats";
import { ExternalLink, Calendar, ShoppingBag, PlayCircle, Heart, Users, MapPin, Instagram, Music2, Info, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Facebook, Twitter, Youtube, Linkedin, Globe, Share2, Menu, Image as ImageIcon, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useArtistData } from "@/hooks/useArtistData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const PortPreview = () => {
  const { artist, videos, events, surfaceProducts, featuredVideo, loading, portSettings, faqs } = useArtistData();
  const navigate = useNavigate();
  const { trackPlay, trackPause, trackEnded } = useMediaTracking();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const backgroundType = portSettings?.background_type || "color";
  const backgroundValue = portSettings?.background_value || "#000000";
  const backgroundVideoUrl = portSettings?.background_video_url || null;

  // Add event listeners for video tracking
  useEffect(() => {
    console.log('[PortPreview] useEffect triggered - checking video tracking setup');
    
    // Defer to next event loop tick to ensure video element is rendered
    const timeoutId = setTimeout(() => {
      console.log('[PortPreview] Timeout fired - checking refs');
      console.log('[PortPreview] videoRef.current:', videoRef.current);
      console.log('[PortPreview] featuredVideo:', featuredVideo);
      console.log('[PortPreview] artist:', artist);
      
      const videoElement = videoRef.current;
      if (!videoElement) {
        console.warn('[PortPreview] ❌ Video element ref is NULL');
        return;
      }
      if (!featuredVideo) {
        console.warn('[PortPreview] ❌ Featured video data is NULL');
        return;
      }

      console.log('[PortPreview] ✅ Setting up video tracking for:', featuredVideo.title);

      const handlePlay = () => {
        console.log('[PortPreview] Video play event triggered');
        trackPlay({
          contentId: featuredVideo.id,
          title: featuredVideo.title,
          artistName: artist?.display_name || 'Unknown',
          contentType: 'video',
          duration: videoElement.duration || 0,
          playerType: 'feed',
        });
      };

      const handlePause = () => {
        console.log('[PortPreview] Video pause event triggered');
        trackPause({
          contentId: featuredVideo.id,
          title: featuredVideo.title,
          artistName: artist?.display_name || 'Unknown',
          contentType: 'video',
          duration: videoElement.duration || 0,
          currentTime: videoElement.currentTime || 0,
          playerType: 'feed',
        });
      };

      const handleEnded = () => {
        console.log('[PortPreview] Video ended event triggered');
        trackEnded({
          contentId: featuredVideo.id,
          title: featuredVideo.title,
          artistName: artist?.display_name || 'Unknown',
          contentType: 'video',
          duration: videoElement.duration || 0,
          playerType: 'feed',
        });
      };

      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);

      console.log('[PortPreview] ✅ Event listeners attached successfully');
      
      // Cleanup function for the timeout
      return () => {
        console.log('[PortPreview] Cleaning up event listeners');
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }, 0);

    // Cleanup the timeout if component unmounts or deps change before timeout fires
    return () => {
      clearTimeout(timeoutId);
    };
  }, [featuredVideo, artist, trackPlay, trackPause, trackEnded]);
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  const handlePurchase = async (priceId: string, type: 'event' | 'product', itemId: string) => {
    setPurchasingItem(itemId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId, type, itemId }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
    } finally {
      setPurchasingItem(null);
    }
  };

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
        .update({ publish_status: newStatus })
        .eq('artist_id', artist.id);

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

  // Get background styles
  const getBackgroundStyles = () => {
    if (backgroundType === "color") {
      return { backgroundColor: backgroundValue };
    } else if (backgroundType === "image") {
      return {
        backgroundImage: `url(${backgroundValue})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      };
    }
    return {};
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Port Preview</h1>
            <p className="text-muted-foreground mt-1">
              Preview how your Port appears to members
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Default URL
              </Button>
              {portSettings?.custom_domain_verified && portSettings?.custom_domain && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`https://${portSettings.custom_domain}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Custom Domain
                </Button>
              )}
            </div>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublished ? 'Unpublish' : 'Publish Port'}
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {isPublished ? (
              <p>
                <strong>Your Port is live!</strong> It&apos;s publicly accessible at{" "}
                <a 
                  href={`https://subamerica.net/port/${artist.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  subamerica.net/port/{artist.slug}
                </a>
                . Any changes you make will appear immediately.
              </p>
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
        <div className="max-w-5xl mx-auto space-y-8 p-8 border border-primary/20 rounded-lg relative overflow-hidden" style={getBackgroundStyles()}>
          <style>{`
            h1 { color: ${portSettings?.h1_color || '#ffffff'} !important; }
            h2 { color: ${portSettings?.h2_color || '#ffffff'} !important; }
            h3 { color: ${portSettings?.h3_color || '#ffffff'} !important; }
            h4 { color: ${portSettings?.h4_color || '#ffffff'} !important; }
            .text-sm { color: ${portSettings?.text_sm_color || '#ffffff'} !important; }
            .text-base { color: ${portSettings?.text_md_color || '#ffffff'} !important; }
            .text-lg { color: ${portSettings?.text_lg_color || '#ffffff'} !important; }
          `}</style>
          {/* Background Video */}
          {backgroundType === "video" && backgroundVideoUrl && (
            <>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover -z-10"
              >
                <source src={backgroundVideoUrl} type="video/mp4" />
                <source src={backgroundVideoUrl} type="video/webm" />
              </video>
              <div className="absolute inset-0 bg-black/40 -z-10" />
            </>
          )}
          
          {/* Content overlay for better text readability */}
          {(backgroundType === "image" || backgroundType === "video") && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 -z-10" />
          )}
          
          <div className="relative z-0">
          {/* Hero Banner */}
          {artist?.brand?.hero_banner && (
            <div className="relative w-full h-[250px] md:h-[300px] lg:h-[400px] overflow-hidden -mx-8 -mt-8 mb-8">
              {artist.brand.hero_banner.includes('.mp4') || artist.brand.hero_banner.includes('.webm') ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={artist.brand.hero_banner} type="video/mp4" />
                  <source src={artist.brand.hero_banner} type="video/webm" />
                </video>
              ) : (
                <img
                  src={artist.brand.hero_banner}
                  alt="Hero banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
            </div>
          )}

          {/* Hamburger Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 left-4 z-50 bg-card border-border shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">{artist?.display_name}</h2>
              </div>
              <nav className="flex flex-col space-y-4 overflow-y-auto flex-1 pr-2">
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => {
                      navigate('/watch');
                      setMenuOpen(false);
                    }}
                  >
                    <Tv className="mr-3 h-5 w-5" />
                    Watch Now
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => scrollToSection('hero')}
                  >
                    <Heart className="mr-3 h-5 w-5" />
                    Tip Artist
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => scrollToSection('hero')}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    Join Subclub
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => scrollToSection('videos')}
                  >
                    <PlayCircle className="mr-3 h-5 w-5" />
                    Videos
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => scrollToSection('gallery')}
                  >
                    <ImageIcon className="mr-3 h-5 w-5" />
                    Gallery
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => scrollToSection('events')}
                  >
                    <Calendar className="mr-3 h-5 w-5" />
                    Events
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => scrollToSection('merch')}
                  >
                    <ShoppingBag className="mr-3 h-5 w-5" />
                    Merch
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-auto py-4 text-lg"
                    onClick={() => scrollToSection('footer')}
                  >
                    <Share2 className="mr-3 h-5 w-5" />
                    Socials
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Hero Section */}
          <div id="hero" className="text-center space-y-6">
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
              <h1 className="text-5xl font-bold mb-2 flex items-center justify-center gap-3">
                {artist.display_name}
                {artist.is_verified && <VerifiedBadge size="lg" />}
              </h1>
              {artist.scene && (
                <p className="text-xl text-primary">{artist.scene}</p>
              )}
              {artist.bio_short && (
                <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                  {artist.bio_short}
                </p>
              )}
              {((artist as any).city || (artist as any).state || (artist as any).country) && (
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[(artist as any).city, (artist as any).state, (artist as any).country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Featured Video */}
          {featuredVideo && featuredVideo.video_url && (
            <div id="videos">
              <Card className="overflow-hidden gradient-card">
                <video 
                  ref={videoRef}
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
                    <Card key={currentImageIndex + idx} className="gradient-card overflow-hidden max-w-xs mx-auto">
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
                        {event.ticket_type === "stripe" && event.stripe_price_id && event.ticket_price ? (
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => handlePurchase(event.stripe_price_id!, 'event', event.id)}
                            disabled={purchasingItem === event.id}
                          >
                            {purchasingItem === event.id ? 'Processing...' : `Buy Ticket - $${event.ticket_price} ${event.ticket_currency?.toUpperCase()}`}
                          </Button>
                        ) : event.ticket_url && (
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
                        <p className="text-sm text-primary font-bold">{product.currency?.toUpperCase()}{product.price}</p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            if (product.payment_type === "stripe" && product.stripe_price_id) {
                              handlePurchase(product.stripe_price_id, 'product', product.id);
                            } else if (product.link) {
                              window.open(product.link, '_blank');
                            }
                          }}
                          disabled={purchasingItem === product.id}
                        >
                          {purchasingItem === product.id ? 'Processing...' : 
                           product.payment_type === "stripe" ? 'Buy Now' : 'View on Store'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {faqs && faqs.length > 0 && (
            <FAQSection 
              faqs={faqs} 
              textColor={portSettings?.text_lg_color || "#ffffff"} 
            />
          )}

          {/* Footer with Social Links */}
          <footer id="footer" className="border-t border-border pt-8 mt-16">
            <div className="text-center space-y-4">
              <PortSocialStats artistId={artist.id} />
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {artist.display_name}</p>
            </div>
          </footer>

          </div>

          {/* Footer Actions Overlay */}
          <PortFooterActions 
            artistId={artist.id}
            artistName={artist.display_name}
            artistSlug={artist.slug}
            socials={artist.socials}
          />

          {/* Product Dialog */}
          {selectedProduct && (
            <ProductDialog
              product={selectedProduct}
              open={!!selectedProduct}
              onOpenChange={(open) => !open && setSelectedProduct(null)}
              onPurchase={handlePurchase}
              purchasingItem={purchasingItem}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortPreview;
