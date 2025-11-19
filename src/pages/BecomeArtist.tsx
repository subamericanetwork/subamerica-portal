import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Music, CheckCircle, XCircle, Info } from "lucide-react";
import logo from "@/assets/subamerica-logo.jpg";
import { z } from "zod";
import { useScenes } from "@/hooks/useScenes";
import { MemberLayout } from "@/components/layout/MemberLayout";

const artistNameSchema = z.string().trim().min(1, "Artist name required").max(100, "Name too long");
const slugSchema = z.string().trim().min(1, "Port URL required").max(50, "Slug too long").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed");
const bioSchema = z.string().trim().max(500, "Bio too long (max 500 characters)");
const whyJoinSchema = z.string().trim().min(20, "Please provide at least 20 characters").max(1000, "Too long (max 1000 characters)");
const sceneSchema = z.string().trim().max(100, "Scene too long");

const BecomeArtist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { scenes, loading: scenesLoading } = useScenes();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Form state
  const [artistName, setArtistName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [scene, setScene] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");

  useEffect(() => {
    checkExistingApplication();
  }, [user]);

  const checkExistingApplication = async () => {
    if (!user) return;

    try {
      // Check if user is already an artist (priority check)
      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'artist'
      });

      if (roleData) {
        navigate("/dashboard");
        return;
      }

      // Check for existing application
      const { data: appData } = await supabase
        .from("artist_applications")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "approved"])
        .single();

      if (appData) {
        // If they have a pending or approved application, redirect to status page
        navigate("/application-status");
        return;
      }
    } catch (error) {
      console.error("Error checking application:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(slug);
    setSlugAvailable(null);
  };

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);

    try {
      // Check artists table
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('slug')
        .eq('slug', slugToCheck)
        .single();

      // Check pending applications
      const { data: pendingApp } = await supabase
        .from('artist_applications')
        .select('slug')
        .eq('slug', slugToCheck)
        .in('status', ['pending', 'approved'])
        .single();

      setSlugAvailable(!existingArtist && !pendingApp);
    } catch (error) {
      console.error("Error checking slug:", error);
    } finally {
      setCheckingSlug(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (slug) {
        checkSlugAvailability(slug);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate inputs
      artistNameSchema.parse(artistName);
      slugSchema.parse(slug);
      bioSchema.parse(bio);
      whyJoinSchema.parse(whyJoin);
      sceneSchema.parse(scene);

      if (slugAvailable === false) {
        toast.error("This Port URL is already taken");
        setSubmitting(false);
        return;
      }

      // Parse portfolio links
      const links = portfolioLinks
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0)
        .map(link => ({ url: link, platform: 'other' }));

      const { error } = await supabase
        .from("artist_applications")
        .insert({
          user_id: user!.id,
          artist_name: artistName,
          slug: slug,
          bio: bio,
          why_join: whyJoin,
          scene: scene,
          portfolio_links: links,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Application submitted! We'll review it within 48 hours.");
      navigate("/application-status");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Application error:", error);
        toast.error(error.message || "Failed to submit application");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }


  return (
    <MemberLayout>
      <div className="min-h-screen p-4 gradient-hero">
        <div className="max-w-3xl mx-auto py-8">
          <div className="text-center mb-8">
            <img src={logo} alt="Subamerica Logo" className="h-24 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Become a Subamerican Artist</h1>
            <p className="text-muted-foreground text-lg mb-4">
              Join our curated community of independent artists
            </p>
            <Button variant="ghost" onClick={() => navigate("/member/dashboard")} className="gap-2">
              ← Back to Member Home
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Artist Application
              </CardTitle>
              <CardDescription>
                Tell us about yourself and your art. We review all applications within 48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist/Band Name *</Label>
                  <Input
                    id="artistName"
                    value={artistName}
                    onChange={(e) => {
                      setArtistName(e.target.value);
                      generateSlug(e.target.value);
                    }}
                    placeholder="Your Artist Name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Port URL *</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="your-port-url"
                      pattern="[a-z0-9-]+"
                      required
                    />
                    {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {slugAvailable === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {slugAvailable === false && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your Port will be: <span className="font-mono text-primary">subamerica.net/{slug || "your-port"}</span>
                  </p>
                  {slugAvailable === false && (
                    <p className="text-xs text-red-500">This URL is already taken</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scene">Music Scene/Genre</Label>
                  <Select value={scene} onValueChange={setScene}>
                    <SelectTrigger id="scene">
                      <SelectValue placeholder="Select your music scene" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenesLoading ? (
                        <SelectItem value="loading" disabled>Loading scenes...</SelectItem>
                      ) : scenes.length > 0 ? (
                        scenes.map((s) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.emoji} {s.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="other" disabled>No scenes available</SelectItem>
                      )}
                      <SelectItem value="Other">🎵 Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the scene that best represents your music
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Artist Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your music and artistic journey (max 500 characters)"
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bio.length}/500 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whyJoin">Why do you want to join Subamerica? *</Label>
                  <Textarea
                    id="whyJoin"
                    value={whyJoin}
                    onChange={(e) => setWhyJoin(e.target.value)}
                    placeholder="Share your motivations and what makes Subamerica the right platform for you (20-1000 characters)"
                    required
                    rows={6}
                    minLength={20}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {whyJoin.length}/1000 characters {whyJoin.length < 20 && `(minimum 20 characters)`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioLinks">Portfolio Links (Optional)</Label>
                  <Textarea
                    id="portfolioLinks"
                    value={portfolioLinks}
                    onChange={(e) => setPortfolioLinks(e.target.value)}
                    placeholder="Add links to your music, social media, or other portfolio items (one per line)"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Share links to your SoundCloud, Bandcamp, Spotify, YouTube, Instagram, etc.
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Applications are reviewed within 48 hours. We'll notify you via email once your application has been reviewed.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || slugAvailable === false}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MemberLayout>
  );
};

export default BecomeArtist;
