import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Video, Users, Sparkles, Tv, TrendingUp, Globe, Shield, Target, Heart, Home, Play, LogIn, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/subamerica-logo.jpg";
import logoSmall from "@/assets/subamerica-logo-small.jpg";

const ArtistPortal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + "Subamerica" */}
            <div className="flex items-center gap-3">
              <img src={logoSmall} alt="Subamerica" className="h-8" />
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
        </div>
      </header>

      {/* Hero Section with Video Background */}
      <section className="relative container mx-auto px-4 py-16 min-h-[600px] flex items-center">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-10"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50 -z-10" />
        
        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="Subamerica logo" 
              className="h-48 mx-auto"
            />
            <h1 className="text-2xl md:text-3xl text-primary font-bold flex items-center justify-center gap-3">
              Artist Portal
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-coral/10 border border-coral/30" style={{ color: 'hsl(var(--coral))' }}>
                BETA
              </span>
            </h1>
            <p className="eyebrow">Indie Underground — Stream fearless art, sound, and stories 24/7</p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Build your artist portal on Subamerica.net — the creator-first platform to upload, stream, and monetize your music, art, and performance media worldwide.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label="Primary actions">
            <Button 
              size="lg" 
              className="text-lg glow-primary"
              onClick={() => navigate("/auth")}
            >
              Sign In to Portal
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg"
              onClick={() => navigate("/auth?tab=signup")}
            >
              Become a Member
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg"
              onClick={() => navigate("/features")}
            >
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Mission & Vision</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 gradient-card">
              <span className="eyebrow">Mission</span>
              <p className="mt-3 text-foreground/90 leading-relaxed">
                Give artists the tools, visibility, and infrastructure to earn a living from their work—while maintaining ownership, independence, and authenticity.
              </p>
            </Card>
            <Card className="p-6 gradient-card">
              <span className="eyebrow">Vision</span>
              <p className="mt-3 text-foreground/90 leading-relaxed">
                A global home for independent culture—where fearless art, music, and storytelling thrive, powered by technology that keeps creators in control.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">What We Do</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 gradient-card space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Tv className="h-6 w-6 text-primary" />
              </div>
              <span className="eyebrow">Broadcast & Streaming</span>
              <p className="text-foreground/90 leading-relaxed">
                24/7 programming on Roku, Fire TV, Google TV, and Subamerica.net: music videos, performance media, podcasts, and docu-shorts.
              </p>
            </Card>

            <Card className="p-6 gradient-card space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <span className="eyebrow">Creator Empowerment</span>
              <p className="text-foreground/90 leading-relaxed">
                Artists retain rights and keep up to 90% of merch, tips, and ticket revenue through QR-commerce and direct member relationships.
              </p>
            </Card>

            <Card className="p-6 gradient-card space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <span className="eyebrow">Community & Collaboration</span>
              <p className="text-foreground/90 leading-relaxed">
                A living network of musicians, filmmakers, visual artists, and storytellers united by independent expression and shared discovery.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Principles */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Our Principles</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 gradient-card">
              <ul className="space-y-3 text-foreground/90">
                <li className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span><strong>Artist First</strong> — Creators own their work and control revenue.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span><strong>Authenticity</strong> — Celebrate raw, diverse, inclusive expression.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span><strong>Innovation with Purpose</strong> — Use AI to empower, not replace, human creativity.</span>
                </li>
              </ul>
            </Card>
            <Card className="p-6 gradient-card">
              <ul className="space-y-3 text-foreground/90">
                <li className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span><strong>Accessibility</strong> — Clear pricing, simple UX, and global reach.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span><strong>Community</strong> — Networked independence: sovereign creators, shared discovery.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span><strong>Integrity</strong> — Transparent terms and creator-first economics.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* The Ecosystem */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">The Ecosystem</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 gradient-card space-y-4">
              <p className="text-foreground/90 leading-relaxed">
                <a href="https://museplatforms.com/?utm_campaign=sub" target="_blank" rel="noopener noreferrer">
                  <strong className="text-primary hover:underline">Muse Platforms, Inc.</strong>
                </a> — Parent company and innovation lab developing technology for creative independence.
              </p>
              <p className="text-foreground/90 leading-relaxed">
                <strong className="text-primary">IndieStack</strong> — Technology infrastructure powering Subamerica and partner networks (SaaS / white-label).
              </p>
            </Card>
            <Card className="p-6 gradient-card space-y-4">
              <p className="text-foreground/90 leading-relaxed">
                <strong className="text-primary">Subamerica</strong> — Indie Underground — Stream fearless art, sound & stories 24/7.
              </p>
              <p className="text-foreground/90 leading-relaxed">
                <strong className="text-primary">Hercules Media</strong> — Creative production and storytelling partner using the same stack.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Our Promise</h2>
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <p className="text-lg text-foreground/90 leading-relaxed">
              Subamerica stands for the freedom to create, share, and thrive on your own terms. We are building a world where independent artists are seen, heard, and supported—powered by fair technology and a global community that believes fearless art should never be compromised.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4" role="group" aria-label="Secondary actions">
              <Button 
                size="lg" 
                className="text-lg glow-primary"
                onClick={() => navigate("/features")}
              >
                View All Features
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg"
                onClick={() => navigate("/watch")}
              >
                Watch Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg"
                asChild
              >
                <a href="mailto:roger@subamerica.net">
                  Partnerships
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Reach & Access */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Reach & Access</h2>
          <div className="flex flex-wrap gap-4 justify-center max-w-4xl mx-auto" role="list">
            <div className="kpi-card" role="listitem">
              <span className="kpi-value">24/7</span>
              <span className="text-sm text-muted-foreground">Streaming on web & TV</span>
            </div>
            <div className="kpi-card" role="listitem">
              <span className="kpi-value">NYC → Global</span>
              <span className="text-sm text-muted-foreground">Broadcast from New York</span>
            </div>
            <div className="kpi-card" role="listitem">
              <span className="kpi-value">Artist-First</span>
              <span className="text-sm text-muted-foreground">80/20 split of the revenue</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground text-sm space-y-2">
            <p>
              © {new Date().getFullYear()} Subamerica. Indie Underground. Built by Muse Platforms.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href="mailto:hello@subamerica.net" className="hover:text-primary transition-colors">Contact</a>
              <span aria-hidden="true">•</span>
              <button onClick={() => navigate("/terms")} className="text-primary hover:underline">Terms of Service</button>
              <span aria-hidden="true">•</span>
              <button onClick={() => navigate("/privacy")} className="text-primary hover:underline">Privacy Policy</button>
              <span aria-hidden="true">•</span>
              <button onClick={() => navigate("/copyright")} className="text-primary hover:underline">Copyright Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtistPortal;
