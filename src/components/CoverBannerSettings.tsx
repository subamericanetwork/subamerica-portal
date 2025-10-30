import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { validateVideoDuration, validateVideoSize, isVideoFile, isImageFile, validateImageSize } from "@/lib/videoValidation";

interface CoverBannerSettingsProps {
  artistId: string;
  userId: string;
  initialCoverBanner?: string;
  onSave: () => void;
}

export const CoverBannerSettings = ({ 
  artistId, 
  userId, 
  initialCoverBanner,
  onSave 
}: CoverBannerSettingsProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [coverBanner, setCoverBanner] = useState<string | undefined>(initialCoverBanner);
  const [preview, setPreview] = useState<string | undefined>(initialCoverBanner);
  const [isVideo, setIsVideo] = useState<boolean>(
    initialCoverBanner ? initialCoverBanner.includes('.mp4') || initialCoverBanner.includes('.webm') : false
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Validate file
      if (isImageFile(file)) {
        if (!validateImageSize(file)) {
          throw new Error("Image must be less than 5MB");
        }
        setIsVideo(false);
      } else if (isVideoFile(file)) {
        if (!validateVideoSize(file)) {
          throw new Error("Video must be less than 10MB");
        }
        const isValidDuration = await validateVideoDuration(file);
        if (!isValidDuration) {
          throw new Error("Video must be 5 seconds or less");
        }
        setIsVideo(true);
      } else {
        throw new Error("File must be an image (JPG, PNG, WEBP) or video (MP4, WEBM)");
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/cover-banner-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('port-backgrounds')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('port-backgrounds')
        .getPublicUrl(fileName);

      setCoverBanner(publicUrl);
      setPreview(publicUrl);

      toast({
        title: "Success",
        description: "Cover banner uploaded. Click Save to apply changes.",
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

  const handleRemove = () => {
    setCoverBanner(undefined);
    setPreview(undefined);
    setIsVideo(false);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      // Get current artist data
      const { data: currentArtist, error: fetchError } = await supabase
        .from('artists')
        .select('brand')
        .eq('id', artistId)
        .single();

      if (fetchError) throw fetchError;

      // Update brand with cover banner
      const currentBrand = currentArtist.brand as Record<string, any> || {};
      const updatedBrand = {
        ...currentBrand,
        hero_banner: coverBanner || null
      };

      const { error: updateError } = await supabase
        .from('artists')
        .update({ brand: updatedBrand })
        .eq('id', artistId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Cover banner saved successfully",
      });
      
      onSave();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover Banner</CardTitle>
        <CardDescription>
          Upload a banner image or video to display prominently at the top of your port. This will also be used as your background on the{" "}
          <a href="https://artist-portal.subamerica.net/portals" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            artist feed
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cover-banner">Upload Cover Banner</Label>
          <div className="mt-2 space-y-4">
            {preview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {isVideo ? (
                  <video
                    src={preview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full aspect-[21/9] object-cover"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Cover banner preview"
                    className="w-full aspect-[21/9] object-cover"
                  />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Label htmlFor="cover-banner-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload image or video
                    </span>
                  </div>
                </Label>
                <Input
                  id="cover-banner-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Image: JPG, PNG, or WEBP. Max 5MB.<br />
              Video: MP4 or WEBM. Max 10MB, 5 seconds duration.
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Cover Banner"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
