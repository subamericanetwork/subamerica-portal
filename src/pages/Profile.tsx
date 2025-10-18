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
import { BackgroundSettings } from "@/components/BackgroundSettings";
import { FAQManagement } from "@/components/FAQManagement";
import { SEOCompleteness } from "@/components/SEOCompleteness";
import { CustomDomainSettings } from "@/components/CustomDomainSettings";
import { useAuth } from "@/contexts/AuthContext";
import { SocialStatsSection } from "@/components/SocialStatsSection";

const Profile = () => {
  const navigate = useNavigate();
  const { artist, loading, portSettings, faqs } = useArtistData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [bioShort, setBioShort] = useState("");
  const [socials, setSocials] = useState({
    tiktok: "",
    youtube: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: ""
  });
  const [artistImages, setArtistImages] = useState<string[]>([]);
  const [address, setAddress] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "",
    postal_code: ""
  });

  useEffect(() => {
    if (artist) {
      setProfilePhoto(artist.brand?.profile_photo || "");
      setBioShort(artist.bio_short || "");
      setSocials({
        tiktok: artist.socials?.tiktok || "",
        youtube: artist.socials?.youtube || "",
        instagram: artist.socials?.instagram || "",
        facebook: artist.socials?.facebook || "",
        linkedin: artist.socials?.linkedin || "",
        twitter: artist.socials?.twitter || ""
      });
      setArtistImages(artist.brand?.images || []);
      setAddress({
        address_line1: (artist as any).address_line1 || "",
        address_line2: (artist as any).address_line2 || "",
        city: (artist as any).city || "",
        state: (artist as any).state || "",
        country: (artist as any).country || "",
        postal_code: (artist as any).postal_code || ""
      });
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
            images: artistImages
          },
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          city: address.city,
          state: address.state,
          country: address.country,
          postal_code: address.postal_code
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your public profile information and social links
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Social Media Analytics - Consolidated Section */}
        {artist && (
          <SocialStatsSection artistId={artist.id} />
        )}

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

        {/* SEO Completeness Indicator */}
        {artist && (
          <SEOCompleteness
            artist={artist}
            faqs={faqs}
            portSettings={portSettings}
          />
        )}

        {/* FAQ Management */}
        {artist && (
          <FAQManagement
            artistId={artist.id}
            artistName={artist.display_name}
            faqs={faqs}
            onUpdate={() => setRefreshKey(prev => prev + 1)}
          />
        )}

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
            <CardDescription>
              We respect your privacy. Only your city, state, and country will be displayed on your public page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                type="text"
                value={address.address_line1}
                onChange={(e) => setAddress({ ...address, address_line1: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                type="text"
                value={address.address_line2}
                onChange={(e) => setAddress({ ...address, address_line2: e.target.value })}
                placeholder="Apartment, suite, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State or Province"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  type="text"
                  value={address.postal_code}
                  onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                  placeholder="ZIP or Postal Code"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Background Settings */}
        {artist && user && (
          <BackgroundSettings
            key={refreshKey}
            artistId={artist.id}
            userId={user.id}
            initialType={portSettings?.background_type}
            initialValue={portSettings?.background_value}
            initialVideoUrl={portSettings?.background_video_url || ""}
            initialH1Color={portSettings?.h1_color}
            initialH2Color={portSettings?.h2_color}
            initialH3Color={portSettings?.h3_color}
            initialH4Color={portSettings?.h4_color}
            initialTextSmColor={portSettings?.text_sm_color}
            initialTextMdColor={portSettings?.text_md_color}
            initialTextLgColor={portSettings?.text_lg_color}
            onSave={() => setRefreshKey(prev => prev + 1)}
          />
        )}

        {/* Custom Domain Settings */}
        {artist && (
          <CustomDomainSettings 
            artistId={artist.id}
            slug={artist.slug}
            currentDomain={portSettings?.custom_domain}
            isVerified={portSettings?.custom_domain_verified}
          />
        )}

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
