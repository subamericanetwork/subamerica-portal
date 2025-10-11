import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ShoppingBag, Heart, Users, MapPin, ChevronLeft, ChevronRight, Instagram, Facebook, Twitter, Youtube, Linkedin, Music2, Globe, ExternalLink, PlayCircle } from "lucide-react";

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

const Port = () => {
  const { slug } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPortData = async () => {
      if (!slug) return;

      try {
        // Fetch artist by slug using secure public view (excludes email)
        const { data: artistData, error: artistError } = await supabase
          .from("artists_public")
          .select("id, display_name, bio_short, scene, socials, brand")
          .eq("slug", slug)
          .single();

        if (artistError) throw artistError;
        
        // Check if port is published
        const { data: settingsData, error: settingsError } = await supabase
          .from("port_settings")
          .select("publish_status")
          .eq("artist_id", artistData.id)
          .maybeSingle();

        console.log("Port settings check:", { settingsData, settingsError, artistId: artistData.id });

        if (!settingsData || settingsData?.publish_status !== 'published') {
          console.log("Port not published or settings missing");
          setLoading(false);
          return;
        }

        setArtist(artistData);
        console.log("Artist data loaded:", { artistData, images: artistData?.brand && typeof artistData.brand === 'object' ? (artistData.brand as any).images : null });
        // Fetch featured video
        const { data: videoData } = await supabase
          .from("videos")
          .select("id, title, video_url, thumb_url")
          .eq("artist_id", artistData.id)
          .eq("is_featured", true)
          .not("published_at", "is", null)
          .maybeSingle();

        setFeaturedVideo(videoData);

        // Fetch upcoming events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .eq("artist_id", artistData.id)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });

        setEvents(eventsData || []);
        console.log("Events loaded:", eventsData);

        // Fetch surface products
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("artist_id", artistData.id)
          .eq("is_surface", true)
          .order("created_at", { ascending: false });

        setProducts((productsData || []).map(p => ({
          ...p,
          images: Array.isArray(p.images) ? p.images as string[] : null
        })));
        console.log("Products loaded:", productsData);

      } catch (error) {
        console.error("Error fetching port data:", error);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto space-y-8 p-8">
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

          {/* Social Links Bar */}
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
...
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="space-y-4" id="events">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
...
          </div>
        )}

        {/* Merch */}
        {products.length > 0 && (
          <div className="space-y-4" id="merch">
            <h2 className="text-2xl font-bold">Merch</h2>
...
          </div>
        )}

      </div>
    </div>
  );
};

export default Port;
