import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLivepushSync = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncVideo = async (videoId: string, artistId: string) => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('livepush-api', {
        body: { 
          action: 'sync-video',
          videoId, 
          artistId 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      // Check if the response contains an error in the data
      if (response.data?.error) {
        const errorMessage = response.data.message || 'Failed to sync video';
        console.error('Video sync error:', {
          error: response.data.error,
          message: errorMessage,
          details: response.data.details
        });
        throw new Error(errorMessage);
      }

      toast({
        title: "Video Synced!",
        description: "Your video is now available in Livepush",
      });

      return response.data;
    } catch (error) {
      console.error('Sync error:', error);
      
      let errorMessage = "Failed to sync video";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const getSyncStatus = async (videoId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data } = await supabase
        .from('livepush_videos')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      return data;
    } catch (error) {
      console.error('Get sync status error:', error);
      return null;
    }
  };

  return {
    syncVideo,
    getSyncStatus,
    syncing,
  };
};
