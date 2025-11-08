import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { toast } from "sonner";

interface ArtistBrand {
  profile_photo?: string;
  hero_image?: string;
  images?: string[];
}

interface Artist {
  id: string;
  slug: string;
  display_name: string;
  scene?: string;
  brand?: ArtistBrand;
  is_verified: boolean;
}

export const FeaturedArtists = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error } = await supabase
          .from("artists")
          .select(`
            id,
            slug,
            display_name,
            scene,
            brand,
            is_verified,
            port_settings!inner(publish_status)
          `)
          .eq("port_settings.publish_status", "published")
          .order("created_at", { ascending: false })
          .limit(15);

        if (error) throw error;
        setArtists((data || []) as Artist[]);
      } catch (error) {
        console.error("Error fetching artists:", error);
        toast.error("Failed to load artists");
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Discover Our Artists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Discover Our Artists
        </h2>
        
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {artists.map((artist) => {
              const imageUrl = artist.brand?.profile_photo || 
                             artist.brand?.hero_image || 
                             artist.brand?.images?.[0];
              
              return (
                <CarouselItem 
                  key={artist.id} 
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <button
                    onClick={() => navigate(`/${artist.slug}`)}
                    className="group relative h-[400px] w-full overflow-hidden rounded-lg transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{
                        backgroundImage: imageUrl 
                          ? `url(${imageUrl})` 
                          : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--coral)))',
                      }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white line-clamp-1">
                          {artist.display_name}
                        </h3>
                        {artist.is_verified && (
                          <VerifiedBadge size="sm" />
                        )}
                      </div>
                      
                      {artist.scene && (
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
                          {artist.scene}
                        </span>
                      )}
                    </div>
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          <CarouselPrevious className="hidden md:flex -left-12" />
          <CarouselNext className="hidden md:flex -right-12" />
        </Carousel>
      </div>
    </section>
  );
};
