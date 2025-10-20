import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, ShoppingBag, Ticket, ExternalLink, ChevronUp, ChevronDown, Heart, Share2, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TipDialog } from "@/components/TipDialog";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";

interface Artist {
  id: string;
  slug: string;
  display_name: string;
  scene?: string;
  bio_short?: string;
  brand?: any;
  is_verified: boolean;
}

interface ArtistWithDetails extends Artist {
  featuredProduct?: {
    title: string;
    link: string;
    price?: number;
    currency?: string;
  };
  nextEvent?: {
    title: string;
    id: string;
    starts_at: string;
  };
}

const PAGE_SIZE = 6;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function Portals() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <PortalsFeed />
      <FooterRibbon />
    </div>
  );
}

function Header() {
  return (
    <header className="fixed top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={subamericaLogo} alt="Subamerica" className="h-7 w-7 rounded object-cover" />
          <span className="eyebrow text-primary">Subamerica</span>
        </div>
        <p className="text-xs text-muted-foreground md:text-sm">
          Indie Underground — <span className="text-coral">Stream fearless art, sound & stories 24/7</span>
        </p>
      </div>
    </header>
  );
}

function FooterRibbon() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center p-3">
      <div className="pointer-events-auto rounded-full bg-card/80 px-4 py-2 text-xs text-muted-foreground shadow-2xl ring-1 ring-border backdrop-blur-sm">
        <span className="hidden md:inline">Pro tip:</span> Use <kbd className="mx-1 rounded bg-muted px-1">↑</kbd>/
        <kbd className="mx-1 rounded bg-muted px-1">↓</kbd> or swipe to navigate • Press{" "}
        <kbd className="ml-1 rounded bg-muted px-1">Enter</kbd> to open an artist
      </div>
    </div>
  );
}

function PortalsFeed() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pagesLoaded, setPagesLoaded] = useState(0);
  const [artists, setArtists] = useState<ArtistWithDetails[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    loadingRef.current = true;

    try {
      const from = pagesLoaded * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: artistsData, error } = await supabase
        .from("artists")
        .select(`
          id,
          slug,
          display_name,
          scene,
          bio_short,
          brand,
          is_verified,
          port_settings!inner(publish_status)
        `)
        .eq("port_settings.publish_status", "published")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!artistsData || artistsData.length === 0) {
        setHasMore(false);
        loadingRef.current = false;
        setLoading(false);
        return;
      }

      // Fetch additional details for each artist
      const artistsWithDetails = await Promise.all(
        artistsData.map(async (artist) => {
          // Fetch featured product
          const { data: products } = await supabase
            .from("products")
            .select("title, link, price, currency")
            .eq("artist_id", artist.id)
            .eq("is_surface", true)
            .limit(1)
            .maybeSingle();

          // Fetch next event
          const { data: event } = await supabase
            .from("events")
            .select("id, title, starts_at")
            .eq("artist_id", artist.id)
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          return {
            ...artist,
            featuredProduct: products || undefined,
            nextEvent: event || undefined,
          };
        })
      );

      setArtists((prev) => [...prev, ...artistsWithDetails]);
      setHasMore(artistsData.length === PAGE_SIZE);
      setPagesLoaded((p) => p + 1);
    } catch (error) {
      console.error("Error loading artists:", error);
      toast.error("Failed to load artists");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, pagesLoaded]);

  useEffect(() => {
    loadPage();
  }, []);

  // Scroll snap observer to update active index
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sections = Array.from(el.querySelectorAll("section[data-artist]"));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.index || 0);
            setActiveIndex(idx);
            if (idx >= artists.length - 2) {
              loadPage();
            }
          }
        });
      },
      { root: el, threshold: 0.6 }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [artists.length, loadPage]);

  // Keyboard + wheel paging
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let touchStartY = 0;

    const pageTo = (delta: number) => {
      const next = clamp(activeIndex + delta, 0, artists.length - 1);
      const target = root.querySelector(`section[data-index='${next}']`);
      if (target) {
        (target as HTMLElement).scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        pageTo(1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        pageTo(-1);
      }
      if (e.key === "Home") {
        e.preventDefault();
        pageTo(-activeIndex);
      }
      if (e.key === "End") {
        e.preventDefault();
        pageTo(artists.length);
      }
      if (e.key === "Enter") {
        const artist = artists[activeIndex];
        if (artist?.slug) window.open(`/${artist.slug}`, "_blank");
      }
    };

    let wheelLock = false;
    const onWheel = (e: WheelEvent) => {
      if (wheelLock) return;
      wheelLock = true;
      setTimeout(() => (wheelLock = false), 500);
      if (e.deltaY > 10) pageTo(1);
      else if (e.deltaY < -10) pageTo(-1);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = (e.changedTouches[0]?.clientY ?? 0) - touchStartY;
      if (Math.abs(dy) > 40) pageTo(dy < 0 ? 1 : -1);
    };

    window.addEventListener("keydown", onKey);
    root.addEventListener("wheel", onWheel, { passive: true });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      root.removeEventListener("wheel", onWheel as any);
      root.removeEventListener("touchstart", onTouchStart as any);
      root.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [activeIndex, artists.length]);

  if (loading && artists.length === 0) {
    return (
      <main className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radio className="h-5 w-5 animate-spin" />
          <span>Loading the underground…</span>
        </div>
      </main>
    );
  }

  if (!loading && artists.length === 0) {
    return (
      <main className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No artists found.</p>
          <p className="text-sm">Check back soon for more creators.</p>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      className="mx-auto h-[calc(100vh-64px)] w-full max-w-6xl snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Artist portals feed"
    >
      {artists.map((artist, idx) => (
        <section
          key={artist.id}
          data-artist={artist.slug}
          data-index={idx}
          className="relative flex h-[calc(100vh-64px)] snap-start items-stretch justify-center"
          aria-label={`${artist.display_name} — ${artist.scene ?? "Artist"}`}
        >
          <ArtistSlide artist={artist} active={idx === activeIndex} />
        </section>
      ))}

      {/* Loader */}
      <div className="flex h-[30vh] items-center justify-center text-sm text-muted-foreground">
        {hasMore ? (
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 animate-spin" /> Loading the underground…
          </div>
        ) : (
          <div className="opacity-70">You've reached the end — more creators joining soon.</div>
        )}
      </div>
    </main>
  );
}

function ArtistSlide({ artist, active }: { artist: ArtistWithDetails; active: boolean }) {
  const navigate = useNavigate();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);

  // Prioritize hero_banner, then hero_image, then first image
  const heroBanner = artist.brand?.hero_banner;
  const heroImage = artist.brand?.hero_image || artist.brand?.images?.[0];
  const backgroundSource = heroBanner || heroImage;
  const isVideo = backgroundSource && (backgroundSource.includes('.mp4') || backgroundSource.includes('.webm'));
  const profilePhoto = artist.brand?.profile_photo;

  const bgStyle = useMemo(
    () => ({
      backgroundImage: !isVideo && backgroundSource ? `url(${backgroundSource})` : undefined,
    }),
    [backgroundSource, isVideo]
  );

  const handleShare = async () => {
    const shareData = {
      title: artist.display_name,
      text: `Discover ${artist.display_name} on Subamerica — Indie Underground.`,
      url: `${window.location.origin}/${artist.slug}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <>
      <div className="relative flex w-full items-end overflow-hidden rounded-none p-0 md:rounded-2xl md:p-4">
        {/* Background Video or Image */}
        {isVideo && backgroundSource ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-40 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,.6),rgba(0,0,0,.9))]"
            aria-hidden
          >
            <source src={backgroundSource} type="video/mp4" />
            <source src={backgroundSource} type="video/webm" />
          </video>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,.6),rgba(0,0,0,.9))]"
            style={bgStyle}
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/.18),transparent_40%),radial-gradient(circle_at_80%_20%,hsl(var(--coral)/.15),transparent_35%)]"
          aria-hidden
        />

        {/* Content */}
        <div className="relative z-10 grid h-full w-full grid-cols-1 gap-4 p-4 md:grid-cols-12 md:gap-6 md:p-6">
          {/* Left: avatar + meta */}
          <div className="flex flex-col justify-end md:col-span-8">
            <div className="flex items-center gap-4">
              <img
                src={profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.display_name)}&background=random`}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-background/40 ring-offset-2 ring-offset-background"
                loading="lazy"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold leading-tight md:text-3xl">{artist.display_name}</h1>
                  {artist.is_verified && <VerifiedBadge size="md" />}
                </div>
                {artist.scene && <p className="text-sm text-muted-foreground">{artist.scene}</p>}
              </div>
            </div>

            {artist.bio_short && <p className="mt-4 max-w-2xl text-sm/6 text-foreground/80">{artist.bio_short}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate(`/${artist.slug}`)} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Port
              </Button>
              {artist.nextEvent && (
                <Button variant="outline" onClick={() => navigate(`/${artist.slug}`)} className="gap-2">
                  <Ticket className="h-4 w-4" />
                  {artist.nextEvent.title}
                </Button>
              )}
              {artist.featuredProduct && (
                <Button variant="outline" onClick={() => navigate(`/${artist.slug}`)} className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  {artist.featuredProduct.title}
                </Button>
              )}
            </div>

            {/* Merch/Event preview cards */}
            {(artist.featuredProduct || artist.nextEvent) && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {artist.featuredProduct && (
                  <div className="kpi-card min-w-[180px] bg-card/50 backdrop-blur-sm">
                    <div className="mb-2 h-24 w-full rounded-lg bg-muted/30" aria-hidden />
                    <div className="text-xs font-medium">{artist.featuredProduct.title}</div>
                    {artist.featuredProduct.price && (
                      <div className="kpi-value text-xs">
                        ${artist.featuredProduct.price.toFixed(2)} {artist.featuredProduct.currency?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: vertical action bar */}
          <div className="flex items-end justify-end md:col-span-4">
            <ActionRail artist={artist} onTip={() => setTipDialogOpen(true)} onShare={handleShare} />
          </div>
        </div>

        {/* Up/Down affordances */}
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 opacity-60">
          <ChevronUp className="h-5 w-5" />
        </div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 opacity-60">
          <ChevronDown className="h-5 w-5" />
        </div>
      </div>

      <TipDialog
        open={tipDialogOpen}
        onOpenChange={setTipDialogOpen}
        artistId={artist.id}
        artistName={artist.display_name}
        artistSlug={artist.slug}
      />
    </>
  );
}

function ActionRail({
  artist,
  onTip,
  onShare,
}: {
  artist: ArtistWithDetails;
  onTip: () => void;
  onShare: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="mb-6 mr-2 flex flex-col items-center gap-4">
      <button
        onClick={() => window.open(`/${artist.slug}`, "_blank")}
        className="group flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/50 backdrop-blur-sm transition-smooth hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={`Open ${artist.display_name} Port`}
      >
        <ExternalLink className="h-5 w-5" />
      </button>
      <button
        onClick={onTip}
        className="group flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/50 backdrop-blur-sm transition-smooth hover:bg-card hover:text-coral focus:outline-none focus:ring-2 focus:ring-coral"
        aria-label={`Tip ${artist.display_name}`}
      >
        <Heart className="h-5 w-5" />
      </button>
      <button
        onClick={onShare}
        className="group flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/50 backdrop-blur-sm transition-smooth hover:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={`Share ${artist.display_name}`}
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}
