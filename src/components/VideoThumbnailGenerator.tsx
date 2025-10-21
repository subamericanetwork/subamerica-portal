import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { extractThumbnailFromVideo } from '@/lib/thumbnailExtractor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Image, Loader2 } from 'lucide-react';

interface VideoThumbnailGeneratorProps {
  videoId: string;
  videoUrl: string;
  currentThumbnail?: string | null;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
}

export const VideoThumbnailGenerator = ({
  videoId,
  videoUrl,
  currentThumbnail,
  onThumbnailGenerated,
}: VideoThumbnailGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentThumbnail || null);
  const { toast } = useToast();

  const generateThumbnail = async () => {
    setGenerating(true);
    try {
      // Extract thumbnail from video
      const thumbnailBlob = await extractThumbnailFromVideo(videoUrl, 2);
      
      // Upload to Supabase storage
      const fileName = `${videoId}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(`thumbnails/${fileName}`, thumbnailBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(`thumbnails/${fileName}`);

      // Update video record with thumbnail URL
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumb_url: publicUrl })
        .eq('id', videoId);

      if (updateError) throw updateError;

      setPreview(publicUrl);
      onThumbnailGenerated?.(publicUrl);

      toast({
        title: 'Success',
        description: 'Thumbnail generated and saved',
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate thumbnail',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-24 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt="Thumbnail" className="w-full h-full object-cover" />
          ) : (
            <Image className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium">
            {preview ? 'Thumbnail exists' : 'No thumbnail'}
          </p>
          <p className="text-xs text-muted-foreground">
            {preview ? 'Generate a new one to replace' : 'Generate from video'}
          </p>
        </div>

        <Button
          onClick={generateThumbnail}
          disabled={generating}
          variant="outline"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
