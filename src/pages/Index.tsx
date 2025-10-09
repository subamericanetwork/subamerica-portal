import { Button } from "@/components/ui/button";
import { ArrowRight, Video, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
              Subamerica
            </h1>
            <p className="text-2xl md:text-3xl text-foreground/90">
              Creator Portal
            </p>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stream fearless art, sound, and stories 24/7. Manage your Port, connect with fans, and grow your underground presence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg glow-primary"
              onClick={() => navigate("/auth")}
            >
              Sign In to Portal
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg"
              onClick={() => navigate("/dashboard")}
            >
              View Demo
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Manage Content</h3>
              <p className="text-sm text-muted-foreground">
                Upload videos, create events, surface merch—all from one dashboard
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Connect with Fans</h3>
              <p className="text-sm text-muted-foreground">
                QR codes, tip links, and direct engagement tools built in
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Own Your Port</h3>
              <p className="text-sm text-muted-foreground">
                Your branded artist page, your way—accessible to fans everywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
