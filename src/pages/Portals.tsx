import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Play, ShoppingBag, Ticket, ExternalLink, ChevronUp, ChevronDown, Heart, Share2, Radio, Info, Volume2, VolumeX, ChevronLeft, ChevronRight, X, Home, Sparkles, LogIn, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TipDialog } from "@/components/TipDialog";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";

interface ArtistPost {
  title: string;
  caption?: string;
  media_url: string;
  media_type: "image" | "video";
}

interface Artist {
  id: string;
  slug: string;
  display_name: string;
  scene?: string;
  bio_short?: string;
  brand?: any;
  is_verified: boolean;
  posts?: ArtistPost[];
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
  const [showInstructions, setShowInstructions] = useState(() => {
    return localStorage.getItem('portals-instruction-dismissed') !== 'true';
  });

  const handleDismissInstructions = () => {
    localStorage.setItem('portals-instruction-dismissed', 'true');
    setShowInstructions(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <PortalsFeed />
      <FooterRibbon isVisible={showInstructions} onClose={handleDismissInstructions} />
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  
  return (
    <header className="fixed top-0 z-40 w-full border-b border-border bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: Logo + "Subamerica" */}
        <div className="flex items-center gap-3">
          <img src={subamericaLogo} alt="Subamerica" className="h-8" />
          <span className="text-lg font-semibold">Subamerica</span>
        </div>
        
        {/* Right: Navigation Links */}
        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/watch")}>
            <Play className="h-4 w-4" />
            Watch
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/features")}>
            <Sparkles className="h-4 w-4" />
            Features
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/artist-portal")}>
            <Info className="h-4 w-4" />
            About
          </Button>
          
          {/* Mobile + Desktop */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            <LogIn className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Login</span>
          </Button>
          <Button size="sm" className="glow-primary" onClick={() => navigate("/auth?tab=signup")}>
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

interface FooterRibbonProps {
  isVisible: boolean;
  onClose: () => void;
}

function FooterRibbon({ isVisible, onClose }: FooterRibbonProps) {
  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center p-3">
      <div className="pointer-events-auto relative rounded-full bg-card/80 px-4 py-2 pr-10 text-xs text-muted-foreground shadow-2xl ring-1 ring-border backdrop-blur-sm">
        <span className="hidden md:inline">Pro tip:</span> Use <kbd className="mx-1 rounded bg-muted px-1">↑</kbd>/
        <kbd className="mx-1 rounded bg-muted px-1">↓</kbd> or swipe to navigate artists • Use{" "}
        <kbd className="mx-1 rounded bg-muted px-1">←</kbd>/
        <kbd className="mx-1 rounded bg-muted px-1">→</kbd> for posts • Press{" "}
        <kbd className="ml-1 rounded bg-muted px-1">Enter</kbd> to open
        <button
          onClick={onClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-muted"
          aria-label="Dismiss instructions"
        >
          <X className="h-3 w-3" />
        </button>
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
          port_settings!inner(publish_status),
          artist_posts!left(
            title,
            caption,
            media_url,
            media_type,
            display_order
          )
        `)
        .eq("port_settings.publish_status", "published")
        .eq("artist_posts.publish_status", "published")
        .order("created_at", { ascending: false })
        .order("display_order", { foreignTable: "artist_posts", ascending: true })
        .limit(12, { foreignTable: "artist_posts" })
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

          const artistPosts = (artist as any).artist_posts?.slice(0, 12) || [];
          const posts = artistPosts.length > 0 
            ? artistPosts.map((post: any) => ({
                title: post.title,
                caption: post.caption,
                media_url: post.media_url,
                media_type: post.media_type,
              }))
            : undefined;

          return {
            ...artist,
            featuredProduct: products || undefined,
            nextEvent: event || undefined,
            posts,
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

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground text-sm space-y-2">
            <p>© {new Date().getFullYear()} Subamerica. Indie Underground. Built by Muse Platforms.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => window.location.href = '/terms'} className="text-primary hover:underline">Terms of Service</button>
              <span>•</span>
              <button onClick={() => window.location.href = '/privacy'} className="text-primary hover:underline">Privacy Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ArtistSlide({ artist, active }: { artist: ArtistWithDetails; active: boolean }) {
  const navigate = useNavigate();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [mode, setMode] = useState<'post' | 'info'>(artist.posts?.length ? 'post' : 'info');
  const slideRef = useRef<HTMLDivElement>(null);

  const navigatePost = useCallback((direction: 'left' | 'right') => {
    if (!artist.posts) return;
    const newIndex = direction === 'left'
      ? Math.max(0, activePostIndex - 1)
      : Math.min(artist.posts.length - 1, activePostIndex + 1);
    setActivePostIndex(newIndex);
  }, [artist.posts, activePostIndex]);

  // Handle horizontal swipes for post navigation
  useEffect(() => {
    const el = slideRef.current;
    if (!el || !artist.posts || artist.posts.length <= 1 || mode !== 'post') return;

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      
      // Only navigate horizontally if swipe is more horizontal than vertical
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        e.preventDefault();
        e.stopPropagation();
        navigatePost(dx > 0 ? 'left' : 'right');
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd as any);
    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchend', onTouchEnd as any);
    };
  }, [navigatePost, artist.posts, mode]);

  // Handle left/right arrow keys for horizontal navigation
  useEffect(() => {
    if (!active || !artist.posts || artist.posts.length <= 1 || mode !== 'post') return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        navigatePost('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        navigatePost('right');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, navigatePost, artist.posts, mode]);

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
      <div ref={slideRef} className={`relative flex w-full overflow-hidden rounded-none p-0 md:rounded-2xl md:p-4 ${mode === 'post' ? 'items-center' : 'items-end'}`}>
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

        {/* Post Overlay (image/video + title/caption) */}
        {artist.posts && mode === 'post' && (
          <PostOverlay 
            posts={artist.posts} 
            activePostIndex={activePostIndex}
            onNavigate={navigatePost}
            active={active} 
          />
        )}

        {/* Content (Info mode) */}
        <div className={`relative z-10 grid h-full w-full grid-cols-1 gap-3 p-4 pb-16 md:grid-cols-12 md:gap-6 md:p-6 ${mode === 'post' ? 'hidden' : 'block'}`}>
          {/* Left: avatar + meta */}
          <div className="flex flex-col justify-end md:col-span-8">
            <div className="flex items-center gap-4">
              <img
                src={profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.display_name)}&background=random`}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-background/40 ring-offset-1 ring-offset-background md:h-16 md:w-16 md:ring-4 md:ring-offset-2"
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

            {artist.bio_short && <p className="line-clamp-2 mt-3 max-w-2xl text-sm/relaxed text-foreground/80 md:line-clamp-none">{artist.bio_short}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-5">
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

        {/* Bottom-right Toggle FAB */}
        <ToggleFAB mode={mode} hasPost={!!artist.posts?.length} onToggle={() => setMode((m) => (m === 'post' ? 'info' : 'post'))} />
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

function PostOverlay({ 
  posts, 
  activePostIndex, 
  onNavigate,
  active 
}: { 
  posts: ArtistPost[]; 
  activePostIndex: number;
  onNavigate: (direction: 'left' | 'right') => void;
  active: boolean;
}) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevPostIndexRef = useRef(activePostIndex);

  const post = posts[activePostIndex];

  // Reset video when switching posts
  useEffect(() => {
    if (prevPostIndexRef.current !== activePostIndex) {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.currentTime = 0;
      }
      prevPostIndexRef.current = activePostIndex;
    }
  }, [activePostIndex]);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {/* Solid background to prevent see-through */}
      <div className="absolute inset-0 bg-background" aria-hidden />
      
      {/* Media layer */}
      {post.media_type === 'video' ? (
        active ? (
          <video
            key={post.media_url}
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain opacity-40 transition-opacity duration-300"
            src={post.media_url}
            muted
            autoPlay
            loop
            playsInline
            aria-hidden
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity duration-300"
            style={{ backgroundImage: `url(${post.media_url})` }}
            aria-hidden
          />
        )
      ) : (
        <div
          key={post.media_url}
          className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-40 transition-opacity duration-300"
          style={{ backgroundImage: `url(${post.media_url})` }}
          aria-hidden
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" aria-hidden />

      {/* Left Navigation Button */}
      {posts.length > 1 && activePostIndex > 0 && (
        <button
          onClick={() => onNavigate('left')}
          className="pointer-events-auto absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/40 backdrop-blur-sm transition-all hover:bg-background/60 hover:scale-110 md:left-4"
          aria-label="Previous post"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Right Navigation Button */}
      {posts.length > 1 && activePostIndex < posts.length - 1 && (
        <button
          onClick={() => onNavigate('right')}
          className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/40 backdrop-blur-sm transition-all hover:bg-background/60 hover:scale-110 md:right-4"
          aria-label="Next post"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Title + caption */}
      <div className="absolute bottom-5 left-0 right-0 px-4 md:bottom-5 md:px-6">
        <div className="rounded-lg bg-card/60 p-4 backdrop-blur-sm md:p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="line-clamp-2 text-xl font-semibold leading-tight md:text-2xl">{post.title}</h2>
            {posts.length > 1 && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {activePostIndex + 1} / {posts.length}
              </span>
            )}
          </div>
          {post.caption && <p className="line-clamp-3 mt-1 text-sm text-foreground/80 md:text-base">{post.caption}</p>}
        </div>
        
        {/* Pagination Indicators */}
        {posts.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {posts.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activePostIndex 
                    ? 'w-6 bg-primary' 
                    : 'w-1.5 bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mute/Unmute Button for videos */}
      {post.media_type === 'video' && (
        <button
          onClick={toggleMute}
          className="pointer-events-auto absolute bottom-28 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-background/40 backdrop-blur-sm transition-all hover:bg-background/60 hover:scale-110 md:bottom-32 md:right-6"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}

function ToggleFAB({ mode, hasPost, onToggle }: { mode: 'post' | 'info'; hasPost: boolean; onToggle: () => void }) {
  if (!hasPost) return null;
  const isPost = mode === 'post';
  return (
    <button
      onClick={onToggle}
      aria-label={isPost ? 'Show info' : 'Show post'}
      aria-pressed={isPost}
      className={`group absolute bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-xl ring-1 transition-smooth focus:outline-none focus:ring-2 ${
        isPost ? 'bg-primary text-primary-foreground ring-primary/20 hover:brightness-95' : 'bg-card/80 text-foreground ring-border hover:bg-card backdrop-blur-sm'
      }`}
    >
      {isPost ? <Info className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      <span className="hidden md:inline">{isPost ? 'Info' : 'Post'}</span>
      <span className="md:hidden">{isPost ? 'Info' : 'Post'}</span>
    </button>
  );
}
