import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Artist {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  bio_short: string | null;
  bio_long: string | null;
  scene: string | null;
  brand: any;
  socials: any;
}

interface Video {
  id: string;
  title: string;
  kind: string;
  status: string;
  is_featured: boolean;
  captions_url: string | null;
  video_url: string | null;
  thumb_url: string | null;
}

interface Event {
  id: string;
  title: string;
  starts_at: string;
  venue: string | null;
  ticket_url: string | null;
  description: string | null;
  poster_url: string | null;
}

interface Product {
  id: string;
  title: string;
  type: string;
  price: number | null;
  is_surface: boolean;
  pitch: string | null;
  description: string | null;
  link: string | null;
  images: string[] | null;
}

interface PortSettings {
  publish_status: string;
}

export const useArtistData = () => {
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [portSettings, setPortSettings] = useState<PortSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch artist profile
        const { data: artistData, error: artistError } = await supabase
          .from("artists")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (artistError) throw artistError;
        setArtist(artistData);

        if (!artistData) return;

        // Fetch videos
        const { data: videosData } = await supabase
          .from("videos")
          .select("*")
          .eq("artist_id", artistData.id)
          .order("created_at", { ascending: false });

        setVideos(videosData || []);

        // Fetch events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .eq("artist_id", artistData.id)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });

        setEvents(eventsData || []);

        // Fetch products
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("artist_id", artistData.id)
          .order("created_at", { ascending: false });

        setProducts((productsData || []).map(p => ({
          ...p,
          images: Array.isArray(p.images) ? p.images as string[] : null
        })));

        // Fetch port settings
        const { data: settingsData } = await supabase
          .from("port_settings")
          .select("*")
          .eq("artist_id", artistData.id)
          .single();

        setPortSettings(settingsData);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return {
    artist,
    videos,
    events,
    products,
    portSettings,
    loading,
    surfaceProducts: products.filter(p => p.is_surface),
    featuredVideo: videos.find(v => v.is_featured),
  };
};
