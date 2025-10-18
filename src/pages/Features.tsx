import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Video, Calendar, ShoppingBag, DollarSign, Share2, BarChart3, 
  Palette, Globe, Zap, Shield, Users, Sparkles, Music, Target,
  TrendingUp, Heart, Settings, FileText, Eye, CheckCircle2
} from "lucide-react";

const Features = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/50">
      <div className="container max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="mb-4">Platform Overview</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Subamerica Artist Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive platform empowering artists to broadcast, monetize, and connect with their audience—all in one place.
          </p>
        </div>

        <Separator />

        {/* Mission Statement */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Our Mission</h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Subamerica exists to empower artists with complete control over their creative output, distribution, and revenue. 
            We believe in putting artists first—providing the tools, infrastructure, and support needed to build sustainable 
            careers without compromising artistic vision or financial independence.
          </p>
        </section>

        <Separator />

        {/* Core Features */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Core Features</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Video Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <CardTitle>Professional Video Streaming</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Host and stream your content with enterprise-grade infrastructure.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>HD video hosting with adaptive streaming</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Music videos, live performances, and documentaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Closed captions support for accessibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Featured video spotlighting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Livepush integration for live streaming</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Events Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Event Management & Ticketing</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Promote shows and sell tickets directly to your fans.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Integrated event calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Built-in ticket sales via Stripe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Event posters and descriptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Venue and date management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>External ticketing platform integration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Merchandise */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <CardTitle>Merchandise & Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Sell physical and digital products with complete control.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Product catalog with multiple images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Apparel variants (sizes, colors)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Digital downloads and music sales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Printify integration for print-on-demand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Featured products showcase</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Monetization */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <CardTitle>Direct Monetization</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Multiple revenue streams, all under your control.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Fan tipping with custom amounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Product sales with Stripe integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Event ticket revenue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Payment history and tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Secure payment processing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Portfolio & Branding */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Portfolio & Branding</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <CardTitle>Custom Artist Port</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Your personalized landing page that showcases everything you do.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unique artist slug (subamerica.tv/your-name)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Custom backgrounds (solid colors, gradients, videos)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Typography and color customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bio (short and long versions)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Scene and location information</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Custom Domain Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Use your own domain for maximum brand control.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Connect custom domains to your port</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Automatic domain verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>SSL security included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Maintain your brand identity</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <CardTitle>Social Media Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Connect all your social platforms and showcase your reach.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Link to Instagram, Spotify, YouTube, and more</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Display follower counts and engagement metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Granular visibility controls per platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Choose which stats to display publicly</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>FAQ Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Answer common questions and improve discoverability.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Create custom FAQ sections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Control visibility and ordering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Improve SEO with rich content</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Analytics & Insights */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Analytics & Insights</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Track Your Growth</CardTitle>
              <CardDescription>
                Understand your audience and measure your impact with built-in analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 md:grid-cols-2">
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">SEO Completeness Tracker</p>
                    <p className="text-sm text-muted-foreground">Monitor and optimize your discoverability</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Social Media Reach Dashboard</p>
                    <p className="text-sm text-muted-foreground">Aggregate stats across all platforms</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Payment History</p>
                    <p className="text-sm text-muted-foreground">Track all transactions and revenue</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Video Performance</p>
                    <p className="text-sm text-muted-foreground">Manage and organize your content library</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Platform Benefits */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Why Choose Subamerica</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Music className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Artist First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every decision is made with artists' needs at the forefront. You retain full ownership and creative control.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>All-in-One Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No need for multiple services. Streaming, ticketing, merchandise, and payments all integrated seamlessly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enterprise-grade security with Stripe payment processing and robust infrastructure for 99.9% uptime.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Complete Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your brand, your way. Customize every aspect of your presence from colors to content to domain.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Direct Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep more of what you earn. No middlemen taking excessive cuts from your hard work.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Community Focused</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build authentic connections with your fans through direct engagement and transparent communication.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Technical Capabilities */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Technical Capabilities</h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ul className="grid gap-4 md:grid-cols-2">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Authentication</p>
                    <p className="text-sm text-muted-foreground">Protected artist accounts with role-based access</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Global CDN</p>
                    <p className="text-sm text-muted-foreground">Fast content delivery worldwide</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Adaptive Streaming</p>
                    <p className="text-sm text-muted-foreground">HLS video with automatic quality adjustment</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Real-time Updates</p>
                    <p className="text-sm text-muted-foreground">Instant content synchronization across devices</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe Integration</p>
                    <p className="text-sm text-muted-foreground">PCI-compliant payment processing</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">API Integrations</p>
                    <p className="text-sm text-muted-foreground">Livepush, Printify, and more</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Getting Started */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to Take Control?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join the growing community of independent artists who are building sustainable careers on their own terms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a 
                href="/auth" 
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </a>
              <a 
                href="/" 
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>Platform powered by Subamerica • Built for artists, by artists</p>
        </div>
      </div>
    </div>
  );
};

export default Features;
