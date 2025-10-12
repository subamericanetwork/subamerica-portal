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

      toast({
        title: "Video Synced!",
        description: "Your video is now available in Livepush",
      });

      return response.data;
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync video",
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
