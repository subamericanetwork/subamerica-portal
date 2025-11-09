import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMediaTracking } from "@/hooks/useMediaTracking";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FAQSection } from "@/components/FAQSection";
import { PortFooterActions } from "@/components/PortFooterActions";
import { ProductDialog } from "@/components/ProductDialog";
import { PortSocialStats } from "@/components/PortSocialStats";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Calendar, ShoppingBag, Heart, Users, MapPin, ChevronLeft, ChevronRight, Instagram, Facebook, Twitter, Youtube, Linkedin, Music2, Globe, ExternalLink, PlayCircle, Share2, Menu, Image as ImageIcon, Tv } from "lucide-react";
import { sanitizeColor, sanitizeText, sanitizeUrl } from "@/lib/sanitization";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { AudioGallery } from "@/components/AudioGallery";

interface Artist {
  id: string;
  display_name: string;
  bio_short: string | null;
  scene: string | null;
  socials: Record<string, unknown> | null;
  brand: {
    profile_photo?: string;
    images?: string[];
    hero_banner?: string;
  } | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  is_verified?: boolean;
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
  ticket_type: string | null;
  stripe_price_id: string | null;
  ticket_price: number | null;
  ticket_currency: string | null;
  poster_url: string | null;
  description: string | null;
}

interface Product {
  id: string;
  title: string;
  type: string;
  price: number | null;
  link: string | null;
  payment_type: string | null;
  stripe_price_id: string | null;
  currency: string | null;
  images: string[] | null;
  description: string | null;
  variants?: any;
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackPlay, trackPause, trackEnded } = useMediaTracking();
  const { user } = useAuth();
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
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewerDisplayName, setViewerDisplayName] = useState<string>('');
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  // Ref callback for video tracking - guarantees element exists when setting up listeners
  const videoRefCallback = useCallback((element: HTMLVideoElement | null) => {
    if (!element || !featuredVideo || !artist) {
      console.log('[Port] videoRefCallback - skipping setup', {
        hasElement: !!element,
        hasFeaturedVideo: !!featuredVideo,
        hasArtist: !!artist
      });
      return;
    }

    console.log('[Port] ✅ Video element mounted, setting up tracking for:', featuredVideo.title);

    const handlePlay = () => {
      console.log('[Port] Video play event triggered');
      trackPlay({
        contentId: featuredVideo.id,
        title: featuredVideo.title,
        artistName: artist?.display_name || 'Unknown Artist',
        contentType: 'video' as const,
        duration: element.duration || 0,
        playerType: 'featured' as const,
        viewerName: viewerDisplayName || undefined,
      });
    };

    const handlePause = () => {
      console.log('[Port] Video pause event triggered');
      trackPause({
        contentId: featuredVideo.id,
        title: featuredVideo.title,
        artistName: artist?.display_name || 'Unknown Artist',
        contentType: 'video' as const,
        duration: element.duration || 0,
        currentTime: element.currentTime,
        playerType: 'featured' as const,
        viewerName: viewerDisplayName || undefined,
      });
    };

    const handleEnded = () => {
      console.log('[Port] Video ended event triggered');
      trackEnded({
        contentId: featuredVideo.id,
        title: featuredVideo.title,
        artistName: artist?.display_name || 'Unknown Artist',
        contentType: 'video' as const,
        duration: element.duration || 0,
        playerType: 'featured' as const,
        viewerName: viewerDisplayName || undefined,
      });
    };

    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('ended', handleEnded);

    console.log('[Port] ✅ Event listeners attached successfully');

    // Cleanup function
    return () => {
      console.log('[Port] Cleaning up video event listeners');
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('ended', handleEnded);
    };
  }, [featuredVideo, artist, trackPlay, trackPause, trackEnded, viewerDisplayName]);

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
    } finally {
      setPurchasingItem(null);
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
            .select("id, display_name, bio_short, scene, socials, brand, city, state, country, is_verified")
            .eq("id", artistId)
            .single();

          if (artistError) throw artistError;
          setArtist(artistData as Artist);
        } else {
          // Query by slug (original behavior)
          if (!slug) return;

          const { data: artistData, error: artistError } = await supabase
            .from("artists")
            .select("id, display_name, bio_short, scene, socials, brand, city, state, country, is_verified")
            .eq("slug", slug)
            .maybeSingle();

          if (artistError || !artistData) {
            setLoading(false);
            return;
          }
          
          artistId = artistData.id;
          setArtist(artistData as Artist);
          
          // Check if port is published and get background settings
          const { data: settingsData, error: settingsError } = await supabase
            .from("port_settings")
            .select("publish_status, background_type, background_value, background_video_url, h1_color, h2_color, h3_color, h4_color, text_sm_color, text_md_color, text_lg_color")
            .eq("artist_id", artistData.id)
            .maybeSingle();

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
        
        if (import.meta.env.DEV) console.log("Artist data loaded, fetching related content for artist:", String(artistId));

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
        if (import.meta.env.DEV) console.log("Events loaded:", eventsData ? eventsData.length : 0);

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
          console.log("Products loaded:", productsData ? productsData.length : 0);
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

  // Fetch logged-in user's display name for tracking
  useEffect(() => {
    const fetchViewerProfile = async () => {
      if (!user?.id) {
        setViewerDisplayName('');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching viewer profile:', error);
          return;
        }

        if (data?.display_name) {
          setViewerDisplayName(data.display_name);
          console.log('[Port] Viewer display name loaded:', data.display_name);
        }
      } catch (error) {
        console.error('Error in fetchViewerProfile:', error);
      }
    };

    fetchViewerProfile();
  }, [user?.id]);

  // Handle action query parameter from QR codes
  useEffect(() => {
    if (!artist || loading) return;
    
    const action = searchParams.get('action');
    if (!action) return;

    // Small delay to ensure sections are rendered
    const timer = setTimeout(() => {
      switch (action) {
        case 'tip':
          scrollToSection('hero');
          break;
        case 'tickets':
          scrollToSection('events');
          break;
        case 'subscribe':
          scrollToSection('hero');
          break;
        case 'merch':
          scrollToSection('merch');
          break;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [artist, loading, searchParams]);

  // Computed values that depend on artist - must be after all useEffect hooks
  const artistImages = useMemo(() => 
    Array.isArray(artist?.brand?.images) 
      ? artist.brand.images.filter((img): img is string => typeof img === 'string') 
      : [], 
    [artist]
  );
  
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
  const getBackgroundStyles = (): React.CSSProperties => {
    if (backgroundType === "color") {
      return { backgroundColor: sanitizeColor(backgroundValue) };
    } else if (backgroundType === "image" && typeof backgroundValue === 'string') {
      return {
        backgroundImage: `url(${String(backgroundValue)})`,
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
        "name": sanitizeText(faq.question),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": sanitizeText(faq.answer)
        }
      }))
    };

    const sameAsLinks: string[] = [];
    if (artist.socials) {
      Object.values(artist.socials).forEach(url => {
        if (url && typeof url === 'string') {
          const sanitized = sanitizeUrl(url);
          if (sanitized) {
            sameAsLinks.push(sanitized);
          }
        }
      });
    }

    const musicArtistSchema = {
      "@context": "https://schema.org",
      "@type": "MusicArtist",
      "name": sanitizeText(artist.display_name),
      "description": sanitizeText(artist.bio_short || ""),
      ...(artist.scene && typeof artist.scene === 'string' && { "genre": sanitizeText(artist.scene) }),
      ...(sameAsLinks.length > 0 && { "sameAs": sameAsLinks }),
      ...(artist.brand?.profile_photo && typeof artist.brand.profile_photo === 'string' && { "image": sanitizeUrl(artist.brand.profile_photo) })
    };

    return [faqSchema, musicArtistSchema];
  }, [artist, faqs]);

  // Inject custom colors via style tag
  useEffect(() => {
    const styleId = 'port-custom-colors';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (portSettings) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        h1 { color: ${sanitizeColor(portSettings?.h1_color)} !important; }
        h2 { color: ${sanitizeColor(portSettings?.h2_color)} !important; }
        h3 { color: ${sanitizeColor(portSettings?.h3_color)} !important; }
        h4 { color: ${sanitizeColor(portSettings?.h4_color)} !important; }
        .text-sm { color: ${sanitizeColor(portSettings?.text_sm_color)} !important; }
        .text-base { color: ${sanitizeColor(portSettings?.text_md_color)} !important; }
        .text-lg { color: ${sanitizeColor(portSettings?.text_lg_color)} !important; }
      `;
    }
    
    return () => {
      styleEl?.remove();
    };
  }, [portSettings]);

  // Update page title and meta tags
  useEffect(() => {
    if (artist) {
      // Update title
      document.title = `${String(artist.display_name)} - Artist Port | Subamerica Network`;

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', String(artist.bio_short || `${artist.display_name} - Independent artist portfolio`));
      }

      // Update OG tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', String(artist.display_name));
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', String(artist.bio_short || `${artist.display_name} - Independent artist portfolio`));
      }
    }

    return () => {
      // Reset to default on unmount
      document.title = 'Subamerica Artist Portal - Manage Your Artist Port';
    };
  }, [artist]);

  // Inject structured data via script tag
  useEffect(() => {
    const scriptId = 'port-structured-data';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (structuredData) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      
      scriptEl.textContent = JSON.stringify(structuredData);
    }
    
    return () => {
      scriptEl?.remove();
    };
  }, [structuredData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not found state
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

  const coverBanner = artist?.brand?.hero_banner;
  const isCoverBannerVideo = coverBanner && (coverBanner.includes('.mp4') || coverBanner.includes('.webm'));

  return (
    <div className="min-h-screen relative bg-black" style={getBackgroundStyles()}>
        {/* Background Video */}
        {backgroundType === "video" && backgroundVideoUrl && typeof backgroundVideoUrl === 'string' && (
          <>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="fixed inset-0 w-full h-full object-cover -z-10"
            >
              <source src={String(backgroundVideoUrl)} type="video/mp4" />
              <source src={String(backgroundVideoUrl)} type="video/webm" />
            </video>
            <div className="fixed inset-0 bg-black/40 -z-10" />
          </>
        )}
        
        {/* Content overlay for better text readability */}
        {(backgroundType === "image" || backgroundType === "video") && (
          <div className="fixed inset-0 bg-gradient-to-b from-black/30 to-black/60 -z-10" />
        )}
        
        <div className="relative z-0">
          {/* Cover Banner */}
          {coverBanner && (
            <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
              {isCoverBannerVideo ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={coverBanner} type="video/mp4" />
                  <source src={coverBanner} type="video/webm" />
                </video>
              ) : (
                <img
                  src={coverBanner}
                  alt="Cover banner"
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
          className="fixed top-4 left-4 z-50 bg-card border-border shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">{artist?.display_name ? String(artist.display_name) : ''}</h2>
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
                onClick={() => scrollToSection('audio')}
              >
                <Music2 className="mr-3 h-5 w-5" />
                Audio
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
            {artist.brand?.profile_photo && typeof artist.brand.profile_photo === 'string' ? (
              <img 
                src={String(artist.brand.profile_photo)} 
                alt={String(artist.display_name)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-primary">
                {String(artist.display_name).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div>
            <h1 className="text-5xl font-bold mb-2 flex items-center justify-center gap-3">
              {String(artist.display_name)}
              {artist.is_verified && <VerifiedBadge size="lg" />}
            </h1>
            {artist.scene && typeof artist.scene === 'string' && (
              <p className="text-xl text-primary">{String(artist.scene)}</p>
            )}
            {artist.bio_short && typeof artist.bio_short === 'string' && (
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                {String(artist.bio_short)}
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
            <Card className="overflow-hidden gradient-card relative">
              <video 
                ref={videoRefCallback}
                controls 
                className="w-full aspect-video"
                poster={featuredVideo.thumb_url && typeof featuredVideo.thumb_url === 'string' ? String(featuredVideo.thumb_url) : undefined}
              >
                <source src={String(featuredVideo.video_url)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <AddToPlaylistButton videoId={featuredVideo.id} />
              <CardContent className="p-4">
                <h3 className="font-semibold">{String(featuredVideo.title)}</h3>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Audio Gallery */}
        {artist && (
          <AudioGallery 
            artistId={artist.id} 
            artistName={String(artist.display_name)}
            viewerDisplayName={viewerDisplayName || undefined}
          />
        )}

        {/* Image Gallery */}
        {artistImages.length > 0 && (
          <div className="space-y-4" id="gallery">
            <h2 className="text-2xl font-bold">Gallery</h2>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {artistImages.slice(currentImageIndex, currentImageIndex + 2).map((image, idx) => (
                  <Card key={currentImageIndex + idx} className="gradient-card overflow-hidden max-w-xs mx-auto">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      <img 
                        src={String(image)} 
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
                          src={String(event.poster_url)} 
                          alt={String(event.title)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg">{String(event.title)}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {event.starts_at ? String(new Date(event.starts_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })) : 'Date TBA'}
                        </span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{String(event.venue)}</span>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {String(event.description)}
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
                          <a href={String(event.ticket_url)} target="_blank" rel="noopener noreferrer">
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
                    {Array.isArray(product.images) && product.images.length > 0 ? (
                      <img 
                        src={String(product.images[0])} 
                        alt={String(product.title)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm">{String(product.title)}</h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{String(product.description)}</p>
                    )}
                    {product.price && (
                      <p className="text-sm text-primary font-bold">{product.currency?.toUpperCase()}{typeof product.price === 'number' ? product.price.toFixed(2) : String(product.price)}</p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (product.payment_type === "stripe" && product.stripe_price_id) {
                            handlePurchase(product.stripe_price_id, 'product', product.id);
                          } else if (product.link) {
                            window.open(String(product.link), '_blank');
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

        {/* Footer with Social Links */}
        <footer id="footer" className="border-t border-border pt-8 mt-16">
          <div className="text-center space-y-4">
            <PortSocialStats artistId={artist.id} />
            <p className="text-sm text-muted-foreground">© {String(new Date().getFullYear())} {String(artist.display_name)}</p>
            <p className="text-xs text-muted-foreground">
              Site Design & Maintenance{' '}
              <a 
                href="https://subamerica.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-smooth underline"
              >
                Subamerica Network
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>

      {/* Footer Actions Overlay */}
      <PortFooterActions 
        artistId={artist.id}
        artistName={artist.display_name}
        artistSlug={slug || ''}
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
  );
};

export default Port;
