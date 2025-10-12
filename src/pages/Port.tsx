import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FAQSection } from "@/components/FAQSection";
import { Calendar, ShoppingBag, Heart, Users, MapPin, ChevronLeft, ChevronRight, Instagram, Facebook, Twitter, Youtube, Linkedin, Music2, Globe, ExternalLink, PlayCircle, Share2, Menu, Image as ImageIcon } from "lucide-react";

interface Artist {
  id: string;
  display_name: string;
  bio_short: string | null;
  scene: string | null;
  socials: any;
  brand: any;
}

interface Video {
  id: string;
  title: string;
  video_url: string | null;
  thumb_url: string | null;
}

interface Event {
  id: string;
  title: string;
  starts_at: string;
  venue: string | null;
  ticket_url: string | null;
  poster_url: string | null;
  description: string | null;
}

interface Product {
  id: string;
  title: string;
  price: number | null;
  link: string | null;
  images: string[] | null;
  description: string | null;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_visible: boolean;
}

const Port = () => {
  const { slug } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [backgroundType, setBackgroundType] = useState<string>("color");
  const [backgroundValue, setBackgroundValue] = useState<string>("#000000");
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null);
  const [portSettings, setPortSettings] = useState<any>(null);
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    const fetchPortData = async () => {
      // Determine if request is from custom domain or slug-based URL
      // If there's a slug in the URL, use slug-based routing
      // If no slug and hostname is not a known platform domain, check for custom domain
      const hostname = window.location.hostname;
      const hasSlugInUrl = !!slug;
      const isKnownPlatformDomain = hostname === 'localhost' || 
                                   hostname.includes('lovable.app') ||
                                   hostname.includes('lovable.dev') ||
                                   hostname.includes('artist-portal.subamerica.net');
      
      const useCustomDomainRouting = !hasSlugInUrl && !isKnownPlatformDomain;

      let artistId: string | null = null;

      try {
        if (useCustomDomainRouting) {
          // Query by custom domain
          const { data: portData, error: portError } = await supabase
            .from('port_settings')
            .select('artist_id, custom_domain_verified, publish_status, background_type, background_value, background_video_url, h1_color, h2_color, h3_color, h4_color, text_sm_color, text_md_color, text_lg_color')
            .eq('custom_domain', hostname)
            .maybeSingle();

          if (portError || !portData) {
            setLoading(false);
            return;
          }

          // Check if custom domain is verified
          if (!portData.custom_domain_verified) {
            setLoading(false);
            return;
          }

          // Check if published
          if (portData.publish_status !== 'published') {
            setLoading(false);
            return;
          }

          artistId = portData.artist_id;
          setPortSettings(portData);
          setBackgroundType(portData.background_type || "color");
          setBackgroundValue(portData.background_value || "#000000");
          setBackgroundVideoUrl(portData.background_video_url || null);

          // Fetch artist data by artistId
          const { data: artistData, error: artistError } = await supabase
            .from("artists")
            .select("id, display_name, bio_short, scene, socials, brand")
            .eq("id", artistId)
            .single();

          if (artistError) throw artistError;
          setArtist(artistData);
        } else {
          // Query by slug (original behavior)
          if (!slug) return;

          // Fetch artist by slug - using main artists table which has public RLS policy
          console.log("Fetching artist by slug:", slug);
          const { data: artistData, error: artistError } = await supabase
            .from("artists")
            .select("id, display_name, bio_short, scene, socials, brand")
            .eq("slug", slug)
            .maybeSingle();

          console.log("Artist query result:", { artistData, artistError });

          if (artistError) {
            console.error("Error fetching artist:", artistError);
            setLoading(false);
            return;
          }
          
          if (!artistData) {
            console.log("No artist found for slug:", slug);
            setLoading(false);
            return;
          }
          
          artistId = artistData.id;
          setArtist(artistData);
          
          // Check if port is published and get background settings
          console.log("Fetching port settings for artist:", artistId);
          const { data: settingsData, error: settingsError } = await supabase
            .from("port_settings")
            .select("publish_status, background_type, background_value, background_video_url, h1_color, h2_color, h3_color, h4_color, text_sm_color, text_md_color, text_lg_color")
            .eq("artist_id", artistData.id)
            .maybeSingle();

          console.log("Port settings result:", { settingsData, settingsError });

          if (!settingsData || settingsData?.publish_status !== 'published') {
            if (import.meta.env.DEV) console.log("Port not published or settings missing");
            setLoading(false);
            return;
          }

          setPortSettings(settingsData);
          
          // Set background settings
          if (settingsData) {
            setBackgroundType(settingsData.background_type || "color");
            setBackgroundValue(settingsData.background_value || "#000000");
            setBackgroundVideoUrl(settingsData.background_video_url || null);
          }
        }

        if (!artistId) {
          setLoading(false);
          return;
        }
        
        if (import.meta.env.DEV) console.log("Artist data loaded, fetching related content for artist:", artistId);

        // Fetch featured video
        const { data: videoData } = await supabase
          .from("videos")
          .select("id, title, video_url, thumb_url")
          .eq("artist_id", artistId)
          .eq("is_featured", true)
          .not("published_at", "is", null)
          .maybeSingle();

        setFeaturedVideo(videoData);

        // Fetch upcoming events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .eq("artist_id", artistId)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });

        setEvents(eventsData || []);
        if (import.meta.env.DEV) console.log("Events loaded:", eventsData);

        // Fetch surface products
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("artist_id", artistId)
          .eq("is_surface", true)
          .order("created_at", { ascending: false });

        setProducts((productsData || []).map(p => ({
          ...p,
          images: Array.isArray(p.images) ? p.images as string[] : null
        })));
        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) console.log("Products loaded:", productsData);
        }

        // Fetch FAQs
        const { data: faqsData } = await supabase
          .from("artist_faqs")
          .select("*")
          .eq("artist_id", artistId)
          .eq("is_visible", true)
          .order("display_order", { ascending: true });

        setFaqs(faqsData || []);

      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching port data:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPortData();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Port Not Found</h1>
          <p className="text-muted-foreground">This artist portfolio is not available or not published yet.</p>
        </div>
      </div>
    );
  }

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

  // Generate structured data for SEO (FAQPage + MusicArtist schema)
  const structuredData = useMemo(() => {
    if (!artist || faqs.length === 0) return null;

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const sameAsLinks = artist.socials 
      ? Object.values(artist.socials).filter(url => url && typeof url === 'string')
      : [];

    const musicArtistSchema = {
      "@context": "https://schema.org",
      "@type": "MusicArtist",
      "name": artist.display_name,
      "description": artist.bio_short || "",
      ...(artist.scene && { "genre": artist.scene }),
      ...(sameAsLinks.length > 0 && { "sameAs": sameAsLinks }),
      ...(artist.brand?.profile_photo && { "image": artist.brand.profile_photo })
    };

    return [faqSchema, musicArtistSchema];
  }, [artist, faqs]);

  return (
    <>
      {/* Structured Data for SEO/AEO */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      
      <style>{`
        h1 { color: ${portSettings?.h1_color || '#ffffff'} !important; }
        h2 { color: ${portSettings?.h2_color || '#ffffff'} !important; }
        h3 { color: ${portSettings?.h3_color || '#ffffff'} !important; }
        h4 { color: ${portSettings?.h4_color || '#ffffff'} !important; }
        .text-sm { color: ${portSettings?.text_sm_color || '#ffffff'} !important; }
        .text-base { color: ${portSettings?.text_md_color || '#ffffff'} !important; }
        .text-lg { color: ${portSettings?.text_lg_color || '#ffffff'} !important; }
      `}</style>
      <div className="min-h-screen relative" style={getBackgroundStyles()}>
        {/* Background Video */}
        {backgroundType === "video" && backgroundVideoUrl && (
          <>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="fixed inset-0 w-full h-full object-cover -z-10"
            >
              <source src={backgroundVideoUrl} type="video/mp4" />
              <source src={backgroundVideoUrl} type="video/webm" />
            </video>
            <div className="fixed inset-0 bg-black/40 -z-10" />
          </>
        )}
        
        {/* Content overlay for better text readability */}
        {(backgroundType === "image" || backgroundType === "video") && (
          <div className="fixed inset-0 bg-gradient-to-b from-black/30 to-black/60 -z-10" />
        )}
        
        <div className="relative z-0">
          {/* Hamburger Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-card border-border shadow-lg"
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

      <div className="max-w-5xl mx-auto space-y-8 p-8">
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

        {/* FAQ Section */}
        <FAQSection 
          faqs={faqs} 
          textColor={portSettings?.text_md_color || "#ffffff"}
        />

        {/* Merch */}
        {products.length > 0 && (
          <div className="space-y-4" id="merch">
            <h2 className="text-2xl font-bold">Merch</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
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
            {artist.socials && Object.entries(artist.socials).filter(([_, url]) => url && typeof url === 'string').length > 0 && (
              <div className="flex items-center justify-center gap-4 py-2">
                {Object.entries(artist.socials)
                  .filter(([_, url]) => url && typeof url === 'string')
                  .map(([platform, url]) => {
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
                  
                  return (
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
      </div>
    </>
  );
};

export default Port;
