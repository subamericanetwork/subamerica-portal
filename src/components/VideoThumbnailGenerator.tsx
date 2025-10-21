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
    console.log('[VideoThumbnailGenerator] ========== STARTING THUMBNAIL GENERATION ==========');
    console.log('[VideoThumbnailGenerator] Video ID:', videoId);
    console.log('[VideoThumbnailGenerator] Video URL:', videoUrl);
    
    try {
      // Refresh session and get fresh auth token
      console.log('[VideoThumbnailGenerator] Step 1: Refreshing auth session...');
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        console.error('[VideoThumbnailGenerator] Session refresh error:', sessionError);
        throw new Error('Session error: ' + sessionError.message);
      }
      
      if (!session?.user) {
        console.error('[VideoThumbnailGenerator] No valid session after refresh');
        throw new Error('Please sign in again to continue');
      }
      
      console.log('[VideoThumbnailGenerator] Session refreshed successfully');
      console.log('[VideoThumbnailGenerator] User ID:', session.user.id);
      console.log('[VideoThumbnailGenerator] User email:', session.user.email);

      // Verify video ownership
      console.log('[VideoThumbnailGenerator] Step 2: Fetching video data...');
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('id, artist_id, title')
        .eq('id', videoId)
        .single();

      console.log('[VideoThumbnailGenerator] Video query result:', { videoData, videoError });

      if (videoError) {
        console.error('[VideoThumbnailGenerator] Video fetch error:', videoError);
        throw new Error('Failed to fetch video: ' + videoError.message);
      }
      
      if (!videoData) {
        console.error('[VideoThumbnailGenerator] Video not found');
        throw new Error('Video not found');
      }

      console.log('[VideoThumbnailGenerator] Video found:', videoData.title);
      console.log('[VideoThumbnailGenerator] Video artist_id:', videoData.artist_id);

      // Verify artist ownership
      console.log('[VideoThumbnailGenerator] Step 3: Verifying artist ownership...');
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('id, user_id, display_name')
        .eq('id', videoData.artist_id)
        .single();

      console.log('[VideoThumbnailGenerator] Artist query result:', { artistData, artistError });

      if (artistError) {
        console.error('[VideoThumbnailGenerator] Artist fetch error:', artistError);
        throw new Error('Failed to verify artist: ' + artistError.message);
      }

      if (!artistData) {
        console.error('[VideoThumbnailGenerator] Artist not found');
        throw new Error('Artist not found');
      }

      console.log('[VideoThumbnailGenerator] Artist found:', artistData.display_name);
      console.log('[VideoThumbnailGenerator] Artist user_id:', artistData.user_id);
      console.log('[VideoThumbnailGenerator] Session user_id:', session.user.id);
      console.log('[VideoThumbnailGenerator] Match?', artistData.user_id === session.user.id);

      if (artistData.user_id !== session.user.id) {
        console.error('[VideoThumbnailGenerator] User ID mismatch!');
        throw new Error('You do not have permission to modify this video');
      }

      console.log('[VideoThumbnailGenerator] ✓ Ownership verified successfully');

      // Extract thumbnail from video
      console.log('[VideoThumbnailGenerator] Step 4: Extracting thumbnail from video...');
      const thumbnailBlob = await extractThumbnailFromVideo(videoUrl, 2);
      console.log('[VideoThumbnailGenerator] ✓ Thumbnail extracted, size:', thumbnailBlob.size, 'bytes');
      
      // Upload to Supabase storage
      const fileName = `${videoId}-${Date.now()}.jpg`;
      const uploadPath = `${session.user.id}/thumbnails/${fileName}`;
      console.log('[VideoThumbnailGenerator] Step 5: Uploading to storage...');
      console.log('[VideoThumbnailGenerator] Upload path:', uploadPath);
      
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
        .getPublicUrl(`${session.user.id}/thumbnails/${fileName}`);
      
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
