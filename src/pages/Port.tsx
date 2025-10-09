import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ShoppingBag, Heart, Users, MapPin } from "lucide-react";

interface Artist {
  id: string;
  display_name: string;
  bio_short: string | null;
  scene: string | null;
  socials: any;
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

  useEffect(() => {
    const fetchPortData = async () => {
      if (!slug) return;

      try {
        // Fetch artist by slug
        const { data: artistData, error: artistError } = await supabase
          .from("artists")
          .select("id, display_name, bio_short, scene, socials")
          .eq("slug", slug)
          .single();

        if (artistError) throw artistError;
        
        // Check if port is published
        const { data: settingsData } = await supabase
          .from("port_settings")
          .select("publish_status")
          .eq("artist_id", artistData.id)
          .single();

        if (settingsData?.publish_status !== 'published') {
          setLoading(false);
          return;
        }

        setArtist(artistData);

        // Fetch featured video
        const { data: videoData } = await supabase
          .from("videos")
          .select("id, title, video_url, thumb_url")
          .eq("artist_id", artistData.id)
          .eq("is_featured", true)
          .not("published_at", "is", null)
          .single();

        setFeaturedVideo(videoData);

        // Fetch upcoming events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .eq("artist_id", artistData.id)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });

        setEvents(eventsData || []);

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

      } catch (error) {
        console.error("Error fetching port data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortData();
  }, [slug]);

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
          <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">
              {artist.display_name.charAt(0).toUpperCase()}
            </span>
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

          <div className="flex items-center justify-center gap-3">
            <Button size="lg" className="glow-primary">
              <Heart className="h-4 w-4 mr-2" />
              Tip Artist
            </Button>
            <Button size="lg" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Join Subclub
            </Button>
          </div>
        </div>

        {/* Featured Video */}
        {featuredVideo && featuredVideo.video_url && (
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
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="space-y-4">
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
        {products.length > 0 && (
          <div className="space-y-4">
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

        {/* Social Links */}
        {artist.socials && Object.keys(artist.socials).length > 0 && (
          <div className="pt-6 border-t border-border">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {Object.entries(artist.socials).map(([platform, url]) => (
                <a 
                  key={platform}
                  href={url as string} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-smooth capitalize"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Port;
