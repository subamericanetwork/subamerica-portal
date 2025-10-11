import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useArtistData } from "@/hooks/useArtistData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, User } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { artist, loading } = useArtistData();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [bioShort, setBioShort] = useState("");
  const [website, setWebsite] = useState("");
  const [socials, setSocials] = useState({
    tiktok: "",
    youtube: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: ""
  });
  const [artistImages, setArtistImages] = useState<string[]>([]);

  useEffect(() => {
    if (artist) {
      setProfilePhoto(artist.brand?.profile_photo || "");
      setBioShort(artist.bio_short || "");
      setWebsite(artist.brand?.website || "");
      setSocials({
        tiktok: artist.socials?.tiktok || "",
        youtube: artist.socials?.youtube || "",
        instagram: artist.socials?.instagram || "",
        facebook: artist.socials?.facebook || "",
        linkedin: artist.socials?.linkedin || "",
        twitter: artist.socials?.twitter || ""
      });
      setArtistImages(artist.brand?.images || []);
    }
  }, [artist]);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artist) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      setProfilePhoto(publicUrl);
      
      toast({
        title: "Success",
        description: "Profile photo uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artist || artistImages.length >= 5) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/image-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      setArtistImages([...artistImages, publicUrl]);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setArtistImages(artistImages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!artist) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('artists')
        .update({
          bio_short: bioShort,
          socials: socials,
          brand: {
            ...artist.brand,
            profile_photo: profilePhoto,
            website: website,
            images: artistImages
          }
        })
        .eq('id', artist.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!artist) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <p className="text-muted-foreground">No artist profile found</p>
        </div>
      </DashboardLayout>
    );
  }

  const charCount = bioShort.length;
  const maxChars = 150;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your public profile information and social links
          </p>
        </div>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>
              Upload a profile photo that represents you. This will be displayed on your public port.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePhoto} alt={artist.display_name} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="profile-photo" className="cursor-pointer">
                  <Button variant="outline" disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle>Short Bio</CardTitle>
            <CardDescription>
              Write a brief description about yourself (maximum 150 characters). This appears at the top of your port.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                value={bioShort}
                onChange={(e) => setBioShort(e.target.value.slice(0, maxChars))}
                placeholder="e.g., Electronic music producer and DJ from Brooklyn, NY"
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {charCount}/{maxChars} characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Website */}
        <Card>
          <CardHeader>
            <CardTitle>Website</CardTitle>
            <CardDescription>
              Add a link to your personal website or portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>
              Connect your social media profiles. Enter the full URL for each platform you use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                type="url"
                value={socials.tiktok}
                onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
                placeholder="https://tiktok.com/@yourusername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                type="url"
                value={socials.youtube}
                onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                placeholder="https://youtube.com/@yourusername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                type="url"
                value={socials.instagram}
                onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                placeholder="https://instagram.com/yourusername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                type="url"
                value={socials.facebook}
                onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
                placeholder="https://facebook.com/yourusername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                type="url"
                value={socials.linkedin}
                onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourusername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">X (Twitter)</Label>
              <Input
                id="twitter"
                type="url"
                value={socials.twitter}
                onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                placeholder="https://x.com/yourusername"
              />
            </div>
          </CardContent>
        </Card>

        {/* Artist Images */}
        <Card>
          <CardHeader>
            <CardTitle>Artist Images</CardTitle>
            <CardDescription>
              Upload up to 5 images to showcase your work, performances, or brand. These images will appear in your port gallery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artistImages.map((image, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={image}
                    alt={`Artist image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {artistImages.length < 5 && (
                <Label
                  htmlFor="artist-image"
                  className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Upload Image
                      </p>
                    </div>
                  )}
                </Label>
              )}
            </div>
            <Input
              id="artist-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading || artistImages.length >= 5}
            />
            <p className="text-xs text-muted-foreground">
              {artistImages.length}/5 images uploaded. JPG, PNG or GIF. Max size 5MB per image.
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
