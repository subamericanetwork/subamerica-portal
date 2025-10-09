import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, ShoppingBag, PlayCircle, Heart, Users } from "lucide-react";

const PortPreview = () => {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Port Preview</h1>
            <p className="text-muted-foreground mt-1">
              Preview how your Port appears to fans
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button>Request Publish</Button>
          </div>
        </div>

        {/* Port Preview */}
        <div className="max-w-5xl mx-auto space-y-8 p-8 border border-primary/20 rounded-lg bg-gradient-to-b from-card to-background">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">SS</span>
            </div>
            
            <div>
              <h1 className="text-5xl font-bold mb-2">Starry Schemes</h1>
              <p className="text-xl text-primary">NYC • dream-pop</p>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Dream-pop textures meet neon grit. Crafting sonic landscapes from Brooklyn rooftops to your headphones.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="glow-primary">
                <Heart className="h-4 w-4 mr-2" />
                Tip Artist
              </Button>
              <Button size="lg" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Join Fan Club
              </Button>
            </div>
          </div>

          {/* Featured Video */}
          <Card className="overflow-hidden gradient-card">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <div className="text-center">
                <PlayCircle className="h-16 w-16 mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Lunar Static - Music Video</p>
              </div>
            </div>
          </Card>

          {/* Events */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="gradient-card">
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Secret Rooftop Session</h3>
                      <p className="text-sm text-muted-foreground">Oct 13, 2025 • NYC, Online</p>
                      <Button size="sm" className="mt-2">Get Tickets</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Merch */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Merch</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="gradient-card overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm">Tour Tee</h3>
                    <p className="text-sm text-primary font-bold mt-1">$28</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="pt-6 border-t border-border">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                Instagram
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                TikTok
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                Bandcamp
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                Patreon
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortPreview;
