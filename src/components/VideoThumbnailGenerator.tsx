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
    console.log('[VideoThumbnailGenerator] Starting generation for video:', videoId);
    console.log('[VideoThumbnailGenerator] Video URL:', videoUrl);
    
    try {
      // Extract thumbnail from video
      console.log('[VideoThumbnailGenerator] Calling extractThumbnailFromVideo...');
      const thumbnailBlob = await extractThumbnailFromVideo(videoUrl, 2);
      console.log('[VideoThumbnailGenerator] Thumbnail blob created:', thumbnailBlob.size, 'bytes');
      
      // Upload to Supabase storage - path must match RLS policy: user_id/thumbnails/...
      const fileName = `${videoId}-${Date.now()}.jpg`;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const uploadPath = `${user.id}/thumbnails/${fileName}`;
      console.log('[VideoThumbnailGenerator] Uploading to:', uploadPath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(uploadPath, thumbnailBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[VideoThumbnailGenerator] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[VideoThumbnailGenerator] Upload successful');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(`${user.id}/thumbnails/${fileName}`);
      
      console.log('[VideoThumbnailGenerator] Public URL:', publicUrl);

      // Update video record with thumbnail URL
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumb_url: publicUrl })
        .eq('id', videoId);

      if (updateError) {
        console.error('[VideoThumbnailGenerator] Update error:', updateError);
        throw updateError;
      }

      console.log('[VideoThumbnailGenerator] Database updated successfully');
      setPreview(publicUrl);
      onThumbnailGenerated?.(publicUrl);

      toast({
        title: 'Success',
        description: 'Thumbnail generated and saved',
      });
    } catch (error: any) {
      console.error('[VideoThumbnailGenerator] Error generating thumbnail:', error);
      console.error('[VideoThumbnailGenerator] Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      
      toast({
        title: 'Error',
        description: error?.message || 'Failed to generate thumbnail',
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
