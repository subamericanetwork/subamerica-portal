import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  validateVideoDuration, 
  validateVideoSize, 
  isVideoFile,
  isImageFile,
  validateImageSize 
} from "@/lib/videoValidation";

interface BackgroundSettingsProps {
  artistId: string;
  userId: string;
  initialType?: string;
  initialValue?: string;
  initialVideoUrl?: string;
  onSave: () => void;
}

export const BackgroundSettings = ({
  artistId,
  userId,
  initialType = "color",
  initialValue = "#000000",
  initialVideoUrl = "",
  onSave,
}: BackgroundSettingsProps) => {
  const [backgroundType, setBackgroundType] = useState(initialType);
  const [backgroundColor, setBackgroundColor] = useState(initialValue);
  const [backgroundImage, setBackgroundImage] = useState(initialType === "image" ? initialValue : "");
  const [backgroundVideo, setBackgroundVideo] = useState(initialVideoUrl);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialType === "image" ? initialValue : null
  );
  const [videoPreview, setVideoPreview] = useState<string | null>(
    initialVideoUrl ? initialVideoUrl : null
  );
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    if (!validateImageSize(file)) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/background-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError, data } = await supabase.storage
        .from("port-backgrounds")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("port-backgrounds")
        .getPublicUrl(fileName);

      setBackgroundImage(publicUrl);
      setImagePreview(URL.createObjectURL(file));

      toast({
        title: "Success",
        description: "Background image uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload background image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isVideoFile(file)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP4 or WEBM video.",
        variant: "destructive",
      });
      return;
    }

    if (!validateVideoSize(file)) {
      toast({
        title: "File too large",
        description: "Video must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const isValidDuration = await validateVideoDuration(file);
    if (!isValidDuration) {
      toast({
        title: "Video too long",
        description: "Video must be 5 seconds or less.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/background-video-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("port-backgrounds")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("port-backgrounds")
        .getPublicUrl(fileName);

      setBackgroundVideo(publicUrl);
      setVideoPreview(URL.createObjectURL(file));

      toast({
        title: "Success",
        description: "Background video uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload background video.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    let updateData: {
      background_type: string;
      background_value: string;
      background_video_url: string | null;
    } = {
      background_type: backgroundType,
      background_value: backgroundColor,
      background_video_url: null,
    };

    if (backgroundType === "image") {
      updateData.background_value = backgroundImage;
    } else if (backgroundType === "video") {
      updateData.background_value = "";
      updateData.background_video_url = backgroundVideo;
    }

    const { error } = await supabase
      .from("port_settings")
      .update(updateData)
      .eq("artist_id", artistId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save background settings.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Background settings saved successfully.",
    });

    onSave();
  };

  const removeImage = () => {
    setBackgroundImage("");
    setImagePreview(null);
  };

  const removeVideo = () => {
    setBackgroundVideo("");
    setVideoPreview(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Port Background</CardTitle>
        <CardDescription>
          Customize your port's background with a color, image, or short video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Background Type</Label>
          <RadioGroup value={backgroundType} onValueChange={setBackgroundType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="color" id="color" />
              <Label htmlFor="color" className="cursor-pointer">Solid Color</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <Label htmlFor="image" className="cursor-pointer">Background Image</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video" />
              <Label htmlFor="video" className="cursor-pointer">Background Video (≤5s)</Label>
            </div>
          </RadioGroup>
        </div>

        {backgroundType === "color" && (
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        )}

        {backgroundType === "image" && (
          <div className="space-y-2">
            <Label>Background Image</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Background preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload image (Max 5MB, JPG/PNG/WEBP)"}
                    </span>
                  </div>
                </Label>
              </div>
            )}
          </div>
        )}

        {backgroundType === "video" && (
          <div className="space-y-2">
            <Label>Background Video</Label>
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  className="w-full h-48 object-cover rounded-md"
                  controls
                  loop
                  muted
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Label htmlFor="video-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload video (Max 10MB, ≤5s, MP4/WEBM)"}
                    </span>
                  </div>
                </Label>
              </div>
            )}
          </div>
        )}

        <Button onClick={handleSave} disabled={uploading} className="w-full">
          Save Background Settings
        </Button>
      </CardContent>
    </Card>
  );
};
