import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tv, MonitorPlay, ExternalLink, Radio } from "lucide-react";
import { ConditionalHeader } from "@/components/ConditionalHeader";

const Watch = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    document.title = "Watch Subamerica Live - Indie Underground 24/7 Stream";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Watch Subamerica live 24/7 - streaming fearless indie art, music videos, and stories. Available on Roku, Google TV, Fire TV, Apple TV, and web.'
      );
    }

    const initPlayer = async () => {
      if (!videoRef.current) return;

      const videoElement = videoRef.current;
      const streamUrl = 'https://hls-m5ixdesk-livepush.akamaized.net/live_cdn/nsDTmMQ796J8Qk/emvJyyEvXzer9Rw-/index.m3u8';

      console.log('Initializing player...');

      // Check if HLS is natively supported (Safari)
      if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('Using native HLS support');
        videoElement.src = streamUrl;
      } else {
        // Use HLS.js for other browsers
        console.log('Loading HLS.js...');
        const Hls = (await import('hls.js')).default;
        
        if (Hls.isSupported()) {
          console.log('HLS.js supported, creating player...');
          const hls = new Hls({
            debug: true,
            enableWorker: true,
            lowLatencyMode: false,
          });
          
          hlsRef.current = hls;
          
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            console.log('Media attached');
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('Manifest parsed, starting playback');
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data.type, data.details, data.fatal);
            if (data.fatal) {
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('Fatal network error, trying to recover...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('Fatal media error, trying to recover...');
                  hls.recoverMediaError();
                  break;
                default:
                  console.log('Unrecoverable error');
                  hls.destroy();
                  break;
              }
            }
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(videoElement);
        } else {
          console.error('HLS.js not supported');
        }
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const platformLinks = {
    roku: "https://channelstore.roku.com/details/aa54e5a3da516ba56230e19c8888733c/subamerica",
    googleTv: "https://play.google.com/store/apps/details?id=com.subamerica.tv",
    fireTv: "https://www.amazon.com/dp/B0XXXXX",
    appleTv: "https://apps.apple.com/us/app/subamerica/idXXXXXX"
  };

  return (
    <div className="min-h-screen gradient-hero">
      <ConditionalHeader />

      <main className="container mx-auto px-4 py-8 md:py-16 pt-[80px]">
        {/* Hero Section with Live Player */}
        <section className="max-w-6xl mx-auto mb-16">
          <div className="text-center space-y-6 mb-8">
            <Badge variant="destructive" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
              <Radio className="h-4 w-4 animate-pulse" />
              LIVE NOW
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-primary">
              Subamerica: Indie Underground
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Stream fearless art, sound & stories 24/7
            </p>
            <p className="text-base text-muted-foreground">
              Broadcasting worldwide from New York City
            </p>
          </div>

          {/* Live Player */}
          <div className="relative w-full max-w-5xl mx-auto">
            <AspectRatio ratio={16/9} className="bg-black rounded-lg overflow-hidden border border-border shadow-2xl">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full bg-black"
                controls
                playsInline
              />
            </AspectRatio>
            <p className="text-center text-sm text-muted-foreground mt-4">
              If the player doesn't load, try{" "}
              <a 
                href="https://player.livepush.io/live/emvJyyEvXzer9Rw-" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                opening the player directly <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </section>

        {/* Platform Cards Section */}
        <section className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Watch Everywhere</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take Subamerica with you on your favorite streaming platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Roku Card */}
            <Card className="gradient-card group hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Tv className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Watch on Roku</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  Instant access to our 24/7 stream plus on-demand genre hubs
                </CardDescription>
                <Button asChild className="w-full" size="lg">
                  <a 
                    href={platformLinks.roku}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Add Channel on Roku
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Google TV Card */}
            <Card className="gradient-card group hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <MonitorPlay className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Watch on Google TV</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  Subamerica on Google TV: Where fearless indie art streams 24/7
                </CardDescription>
                <Button asChild className="w-full" size="lg">
                  <a 
                    href={platformLinks.googleTv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Get on Google TV
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Fire TV Card */}
            <Card className="gradient-card group hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Tv className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Watch on Fire TV</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  Amazon Fire TV: Stream independent culture on your terms
                </CardDescription>
                <Button asChild className="w-full" size="lg">
                  <a 
                    href={platformLinks.fireTv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Get on Fire TV
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Apple TV Card */}
            <Card className="gradient-card group hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Tv className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Watch on Apple TV</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  Apple TV: Premium streaming for independent artists
                </CardDescription>
                <Button asChild className="w-full" size="lg">
                  <a 
                    href={platformLinks.appleTv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Download on Apple TV
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
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

export default Watch;
