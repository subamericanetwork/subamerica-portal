import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tv, 
  CreditCard, 
  Globe, 
  TrendingUp, 
  Search, 
  Users,
  Heart,
  Sparkles,
  ChevronDown,
  Music,
  Film,
  Ticket
} from "lucide-react";
import logoSmall from "@/assets/subamerica-logo-small.jpg";

const ArtistPortal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={logoSmall} 
              alt="Subamerica Logo" 
              className="h-10 w-10 rounded-full"
            />
            <span className="text-xl font-bold">Subamerica</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
            <Button variant="ghost" onClick={() => navigate("/watch")}>Watch</Button>
            <Button variant="ghost" onClick={() => navigate("/features")}>Features</Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>Login</Button>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.4)' }}
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-[hsl(var(--coral))] to-[hsl(var(--teal))] bg-clip-text text-transparent">
                Welcome to the Artist-First Broadcast Economy
              </span>
            </h1>
            
            <div className="bg-background/40 backdrop-blur-sm p-6 rounded-lg max-w-3xl mx-auto">
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'hsl(var(--teal))' }}>
                Subamerica is an underground arts & music community where creators keep 80% of revenue, own their work, and broadcast fearlessly across Roku, Fire TV, Google TV, Apple TV, web and mobile platforms. No middlemen extracting value. No gatekeepers blocking access. Just a network powered by independent artists.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 glow-primary hover-scale"
                onClick={() => navigate("/auth")}
              >
                Join the Community
              </Button>
              <p className="text-sm text-muted-foreground">
                Free to join • Approved artists keep 80% • Instant Stripe payouts
              </p>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8" style={{ color: 'hsl(var(--teal))' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="section-spacing gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="border-l-4 pl-6" style={{ borderColor: 'hsl(var(--coral))' }}>
              <p className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Because the old system sold your art and left you behind.
              </p>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Subamerica flips the script. We've built a network where artists keep <span style={{ color: 'hsl(var(--coral))' }} className="font-bold">80%</span> of what they earn, own their rights, and broadcast directly to fans across web, mobile, and TV.
              </p>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mt-4">
                <span className="font-bold">No labels. No gatekeepers. No waiting months for payouts.</span>
              </p>
              <p className="text-xl md:text-2xl leading-relaxed mt-4" style={{ color: 'hsl(var(--teal))' }}>
                Just fearless, independent media — powered by the artists who make it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Split Screen */}
      <section className="section-spacing bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* For Fans/Members */}
            <Card className="gradient-card border-2 hover-scale transition-smooth overflow-hidden" style={{ borderColor: 'hsl(var(--teal))' }}>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-8 h-8" style={{ color: 'hsl(var(--teal))' }} />
                  <Badge variant="secondary" className="text-lg px-4 py-1">Free</Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-4">For Fans / Members</h3>
                
                <ul className="space-y-3 mb-6 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Join for free and become part of the Indie Underground community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Access our catalog of underground art, music, and performance media</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Create and share your own playlists from our growing catalog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Discover new artists before they break</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Stream on web, mobile, Roku, Fire TV, Google TV, and Apple TV (coming soon!)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Connect backstage to artists via our Discord community</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full"
                  style={{ backgroundColor: 'hsl(var(--teal))' }}
                  onClick={() => navigate("/auth")}
                >
                  Join Free
                </Button>
              </CardContent>
            </Card>

            {/* For Artists/Creators */}
            <Card className="gradient-card border-2 hover-scale transition-smooth overflow-hidden" style={{ borderColor: 'hsl(var(--coral))' }}>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--coral))' }} />
                  <Badge variant="secondary" className="text-lg px-4 py-1">80% Revenue</Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-4">For Artists / Creators</h3>
                
                <ul className="space-y-3 mb-6 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Join and apply to become a featured artist on Subamerica</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Once approved, unlock your own channel: upload content globally</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Sell merch, tickets, and art through integrated QR‑commerce</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Keep 80% of every sale and own your masters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Gain exposure across our broadcast network</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Stream worldwide on web, mobile, and OTT platforms</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full glow-primary"
                  onClick={() => navigate("/become-artist")}
                >
                  Apply to Create
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8 space-x-2 flex flex-wrap justify-center gap-2">
            <Badge variant="outline">Coming Soon: Live Loft Streams</Badge>
            <Badge variant="outline">Underground Sets</Badge>
            <Badge variant="outline">AI Discovery</Badge>
            <Badge variant="outline">Community Features</Badge>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="section-spacing gradient-hero">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Platform Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="hover-scale transition-smooth">
              <CardContent className="p-6 text-center space-y-3">
                <Tv className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--teal))' }} />
                <h3 className="text-xl font-bold">24/7 Global Broadcast</h3>
                <p className="text-muted-foreground">
                  Stream on Roku, Fire TV, Google TV, and Apple TV (coming soon!)
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth">
              <CardContent className="p-6 text-center space-y-3">
                <CreditCard className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--coral))' }} />
                <h3 className="text-xl font-bold">QR‑Commerce Integration</h3>
                <p className="text-muted-foreground">
                  Accept tips, sell merch & tickets with integrated payment solutions
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth">
              <CardContent className="p-6 text-center space-y-3">
                <Globe className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--teal))' }} />
                <h3 className="text-xl font-bold">Customizable Artist Portals</h3>
                <p className="text-muted-foreground">
                  Build your branded presence on subamerica.net
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth">
              <CardContent className="p-6 text-center space-y-3">
                <TrendingUp className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--coral))' }} />
                <h3 className="text-xl font-bold">Analytics & Instant Payouts</h3>
                <p className="text-muted-foreground">
                  Track your performance and receive instant payouts via Stripe
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth">
              <CardContent className="p-6 text-center space-y-3">
                <Search className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--teal))' }} />
                <h3 className="text-xl font-bold">SEO for Artist Discovery</h3>
                <p className="text-muted-foreground">
                  Structured data (MusicArtist Schema, FAQPage) for maximum visibility
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth">
              <CardContent className="p-6 text-center space-y-3">
                <Users className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--coral))' }} />
                <h3 className="text-xl font-bold">Community Support</h3>
                <p className="text-muted-foreground">
                  Access our Discord community directory and creator support
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Ownership & Revenue Promise */}
      <section className="section-spacing bg-background relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <span className="text-[20rem] font-bold">80%</span>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-[hsl(var(--coral))] to-[hsl(var(--teal))] bg-clip-text text-transparent">
                Creators Keep the Keys
              </span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <Music className="w-16 h-16 mx-auto" style={{ color: 'hsl(var(--teal))' }} />
                <p className="text-2xl font-bold">You own your masters</p>
              </div>
              <div className="space-y-2">
                <Ticket className="w-16 h-16 mx-auto" style={{ color: 'hsl(var(--coral))' }} />
                <p className="text-2xl font-bold">You set your price</p>
              </div>
              <div className="space-y-2">
                <Film className="w-16 h-16 mx-auto" style={{ color: 'hsl(var(--teal))' }} />
                <p className="text-2xl font-bold">You keep 80%</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xl text-muted-foreground">
                Transparent Stripe payouts — no labels, no delays, no fine print.
              </p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--coral))' }}>
                This is the broadcast economy built for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Movement */}
      <section className="section-spacing gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <p className="text-3xl md:text-4xl italic font-light">
              Independent doesn't mean invisible.
            </p>
            
            <p className="text-2xl md:text-3xl font-bold leading-relaxed">
              Subamerica is where underground culture lives — a 24/7 channel for fearless art, sound & stories broadcast worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 glow-primary hover-scale"
                onClick={() => navigate("/auth")}
              >
                Join Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 hover-scale"
                onClick={() => navigate("/become-artist")}
              >
                Apply to Broadcast
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold mb-4">Subamerica</h4>
              <p className="text-sm text-muted-foreground">
                The Artist-First Broadcast Economy
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <p className="text-sm text-muted-foreground">
                support@subamerica.net
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <div className="space-y-2">
                <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate("/terms")}>
                  Terms of Service
                </Button>
                <br />
                <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate("/privacy")}>
                  Privacy Policy
                </Button>
                <br />
                <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate("/copyright")}>
                  Copyright Policy
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Muse Platforms, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtistPortal;
