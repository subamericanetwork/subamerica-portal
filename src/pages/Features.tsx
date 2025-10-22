import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, Video, Calendar, ShoppingBag, DollarSign, Globe, Palette, Share2, HelpCircle,
  BarChart3, Shield, Zap, Users, TrendingUp, CheckCircle2, X, Home, Play, Sparkles, Info, LogIn
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/subamerica-logo-small.jpg";

const Features = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + "Subamerica" */}
            <div className="flex items-center gap-3">
              <img src={logo} alt="Subamerica" className="h-8" />
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

      {/* Hero Section */}
      <section className="section-spacing gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <Badge variant="outline" className="text-sm px-4 py-2"><Sparkles className="h-4 w-4 mr-2" />All-in-One Creator Platform</Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="text-primary">Tools That Power the Underground</span>
              <span className="block mt-2 text-3xl md:text-5xl">Everything Independent Artists Need to Upload, Stream, and Earn on Subamerica</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Build your artist port, upload videos, sell merch, and stream your work worldwide — all from one creator-first dashboard. Subamerica gives independent artists the tools to own their art, connect with members, and earn instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg glow-primary" onClick={() => navigate("/auth?tab=signup")}>Start Building<ArrowRight className="h-5 w-5" /></Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => navigate("/watch")}><Play className="h-5 w-5" />Watch</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="eyebrow">Core Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Your Complete Artist Toolkit</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { icon: Video, title: "Video Streaming", subtitle: "(Coming Soon!)", desc: "Professional HLS streaming with global CDN", features: ["Adaptive quality", "Unlimited uploads", "Analytics tracking"] },
              { icon: Calendar, title: "Event Ticketing", desc: "Sell tickets directly to your members", features: ["QR code tickets", "Stripe integration", "Keep 80-90%"] },
              { icon: ShoppingBag, title: "Merch Store", desc: "Sell products with zero inventory", features: ["Print-on-demand", "Auto fulfillment", "Global shipping"] },
              { icon: DollarSign, title: "Direct Tips", desc: "Get paid directly by supporters", features: ["Custom amounts", "Instant payouts", "Member messages"] }
            ].map((feature, idx) => (
              <Card key={idx} className="gradient-card hover-scale transition-smooth">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>
                    {feature.title}
                    {feature.subtitle && <span className="text-[calc(1em-8px)] ml-1">{feature.subtitle}</span>}
                  </CardTitle>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {feature.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="section-spacing border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="eyebrow">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">The Subamerica Difference</h2>
          </div>
          <Card className="max-w-5xl mx-auto gradient-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr><th className="text-left p-6 font-semibold">Feature</th><th className="text-center p-6 font-semibold">Traditional Platforms</th><th className="text-center p-6 font-semibold text-primary">Subamerica</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Revenue Share", "50-70% platform fee", "Keep 80-90%"],
                    ["Custom Domain", "Not available or expensive", "Included"],
                    ["Direct Member Payments", "Limited or restricted", "Tips, products, tickets"],
                    ["Content Ownership", "Platform owns rights", "Full ownership"],
                    ["Monetization Tools", "Scattered across platforms", "All-in-one dashboard"]
                  ].map(([feature, old, new_], idx) => (
                    <tr key={idx} className="hover:bg-accent/50 transition-colors">
                      <td className="p-6 font-medium">{feature}</td>
                      <td className="p-6 text-center text-destructive"><div className="flex items-center justify-center gap-2"><X className="h-5 w-5" /><span>{old}</span></div></td>
                      <td className="p-6 text-center text-primary"><div className="flex items-center justify-center gap-2"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">{new_}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Final CTA */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 gradient-card p-12 rounded-2xl">
            <h2 className="text-3xl md:text-5xl font-bold">Ready to Build Your Port?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Join independent artists worldwide who are taking control of their creative careers with Subamerica.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg glow-primary" onClick={() => navigate("/auth?tab=signup")}>Get Started Free<ArrowRight className="h-5 w-5" /></Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => navigate("/")}>Back to Home</Button>
            </div>
            <p className="text-sm text-muted-foreground pt-4">No credit card required • Full access to all features • Keep 80-90% of revenue</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground text-sm space-y-2">
            <p>© {new Date().getFullYear()} Subamerica. Indie Underground. Built by Muse Platforms.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate("/terms")} className="text-primary hover:underline">Terms of Service</button>
              <span>•</span>
              <button onClick={() => navigate("/privacy")} className="text-primary hover:underline">Privacy Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;