import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Video, Calendar, Heart, Sparkles, ArrowRight, ListMusic, Headphones, Users, Ticket } from "lucide-react";
import logo from "@/assets/subamerica-logo.jpg";
import { usePlaylist } from "@/hooks/usePlaylist";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { playlists, loading } = usePlaylist();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      
      if (data?.display_name) {
        // Extract first name from display name
        const firstName = data.display_name.split(" ")[0];
        setDisplayName(firstName);
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <div className="min-h-screen p-4 gradient-hero">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Subamerica Logo" className="h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">
            Welcome to Subamerica{displayName && `, ${displayName}`}!
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            The Indie Underground Lives Here<br />
            Stream fearless art, music, and stories 24/7. You're not just watching — you're part of the crew.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Become an Artist</CardTitle>
              <CardDescription className="text-base">
                Ready to share your art and music with the world? Create your artist Port and start building your member base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <Music className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Create your own artist Port</span>
                </li>
                <li className="flex items-start gap-2">
                  <Video className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Share videos and playlists</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Promote events and sell tickets</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Receive tips and sell merch (80/20 split)</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/become-artist")} className="w-full gap-2">
                Apply Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-violet-500/10 hover:border-violet-500/50 transition-all">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-violet-500" />
              </div>
              <CardTitle className="text-2xl">My Membership</CardTitle>
              <CardDescription className="text-base">
                Step inside the frequency. Create, explore, and connect with the Indie Underground.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <Headphones className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span><strong>Curate Your Vibe</strong> — Build unlimited playlists with our Jukebox player.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span><strong>Discover Artists</strong> — Explore fearless creators and exclusive drops.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span><strong>Support & Share</strong> — Tip, follow, and show love to your favorites.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ticket className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span><strong>Shop & Show Up</strong> — Buy merch, grab tickets, and power independent culture.</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full gap-2 border-violet-500/50 hover:bg-violet-500/10">
                Enter the Network
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>More Features Coming Soon</CardTitle>
            <CardDescription>
              We're building even more amazing features for members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Personalized Feed</h3>
                <p className="text-sm text-muted-foreground">
                  Get recommendations based on your favorite artists and genres
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Social Features</h3>
                <p className="text-sm text-muted-foreground">
                  Comment, like, and interact with artists and other members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberDashboard;
