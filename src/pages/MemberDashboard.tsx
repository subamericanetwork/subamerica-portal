import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Video, Calendar, Heart, Sparkles, ArrowRight, ListMusic } from "lucide-react";
import logo from "@/assets/subamerica-logo.jpg";
import { usePlaylist } from "@/hooks/usePlaylist";

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { playlists, loading } = usePlaylist();

  return (
    <div className="min-h-screen p-4 gradient-hero">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Subamerica Logo" className="h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Welcome to Subamerica</h1>
          <p className="text-muted-foreground text-lg mb-4">
            The underground music platform for independent artists and members
          </p>
          <p className="text-sm text-muted-foreground">
            Choose your path below, or <Link to="/" className="text-primary hover:underline font-medium">explore artists now</Link>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Become an Artist</CardTitle>
              <CardDescription className="text-base">
                Ready to share your music with the world? Create your artist Port and start building your member base.
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
                <ListMusic className="h-6 w-6 text-violet-500" />
              </div>
              <CardTitle className="text-2xl">My Playlists</CardTitle>
              <CardDescription className="text-base">
                Create custom playlists and enjoy your favorite content with our Jukebox player.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <Music className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span>Create unlimited playlists</span>
                </li>
                <li className="flex items-start gap-2">
                  <Video className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span>Custom Jukebox player experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span>Private or public sharing options</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-violet-500" />
                  <span>Add videos from any artist</span>
                </li>
              </ul>
              {!loading && (
                <p className="text-xs text-muted-foreground mb-4">
                  {playlists.length > 0 
                    ? `You have ${playlists.length} playlist${playlists.length === 1 ? '' : 's'}`
                    : "Get started creating your first playlist"}
                </p>
              )}
              <Button onClick={() => navigate("/member/playlists")} variant="outline" className="w-full gap-2 border-violet-500/50 hover:bg-violet-500/10">
                My Playlists
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-2xl">Just Browsing</CardTitle>
              <CardDescription className="text-base">
                Not ready to create? Explore our curated collection of independent artists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Browse our curated collection of independent artists, watch exclusive content, and support your favorites.
                </p>
                <Button variant="outline" onClick={() => navigate("/")} className="w-full gap-2">
                  Explore Ports
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
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
