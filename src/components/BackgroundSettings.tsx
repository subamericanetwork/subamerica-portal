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
  initialH1Color?: string;
  initialH2Color?: string;
  initialH3Color?: string;
  initialH4Color?: string;
  initialTextSmColor?: string;
  initialTextMdColor?: string;
  initialTextLgColor?: string;
  onSave: () => void;
}

export const BackgroundSettings = ({
  artistId,
  userId,
  initialType = "color",
  initialValue = "#000000",
  initialVideoUrl = "",
  initialH1Color = "#ffffff",
  initialH2Color = "#ffffff",
  initialH3Color = "#ffffff",
  initialH4Color = "#ffffff",
  initialTextSmColor = "#ffffff",
  initialTextMdColor = "#ffffff",
  initialTextLgColor = "#ffffff",
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
  const [h1Color, setH1Color] = useState(initialH1Color);
  const [h2Color, setH2Color] = useState(initialH2Color);
  const [h3Color, setH3Color] = useState(initialH3Color);
  const [h4Color, setH4Color] = useState(initialH4Color);
  const [textSmColor, setTextSmColor] = useState(initialTextSmColor);
  const [textMdColor, setTextMdColor] = useState(initialTextMdColor);
  const [textLgColor, setTextLgColor] = useState(initialTextLgColor);
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
      h1_color: string;
      h2_color: string;
      h3_color: string;
      h4_color: string;
      text_sm_color: string;
      text_md_color: string;
      text_lg_color: string;
    } = {
      background_type: backgroundType,
      background_value: backgroundColor,
      background_video_url: null,
      h1_color: h1Color,
      h2_color: h2Color,
      h3_color: h3Color,
      h4_color: h4Color,
      text_sm_color: textSmColor,
      text_md_color: textMdColor,
      text_lg_color: textLgColor,
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
        <CardTitle>Port Experience</CardTitle>
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

        <div className="space-y-4 border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold">Text Colors</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="h1-color">H1 Heading Color</Label>
              <div className="flex gap-2">
                <Input
                  id="h1-color"
                  type="color"
                  value={h1Color}
                  onChange={(e) => setH1Color(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={h1Color}
                  onChange={(e) => setH1Color(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="h2-color">H2 Heading Color</Label>
              <div className="flex gap-2">
                <Input
                  id="h2-color"
                  type="color"
                  value={h2Color}
                  onChange={(e) => setH2Color(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={h2Color}
                  onChange={(e) => setH2Color(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="h3-color">H3 Heading Color</Label>
              <div className="flex gap-2">
                <Input
                  id="h3-color"
                  type="color"
                  value={h3Color}
                  onChange={(e) => setH3Color(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={h3Color}
                  onChange={(e) => setH3Color(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="h4-color">H4 Heading Color</Label>
              <div className="flex gap-2">
                <Input
                  id="h4-color"
                  type="color"
                  value={h4Color}
                  onChange={(e) => setH4Color(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={h4Color}
                  onChange={(e) => setH4Color(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-sm-color">Small Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="text-sm-color"
                  type="color"
                  value={textSmColor}
                  onChange={(e) => setTextSmColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={textSmColor}
                  onChange={(e) => setTextSmColor(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-md-color">Medium Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="text-md-color"
                  type="color"
                  value={textMdColor}
                  onChange={(e) => setTextMdColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={textMdColor}
                  onChange={(e) => setTextMdColor(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-lg-color">Large Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="text-lg-color"
                  type="color"
                  value={textLgColor}
                  onChange={(e) => setTextLgColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={textLgColor}
                  onChange={(e) => setTextLgColor(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={uploading} className="w-full">
          Save Background Settings
        </Button>
      </CardContent>
    </Card>
  );
};
