import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

interface StreamCredentials {
  streamId: string;
  rtmpUrl: string;
  streamKey: string;
  hlsPlaybackUrl: string;
  livepushStreamId: string;
}

interface StreamConfig {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  scheduledStart?: string;
}

export const useGoLive = (artistId: string) => {
  const [creating, setCreating] = useState(false);
  const [stream, setStream] = useState<StreamCredentials | null>(null);
  const [streamStatus, setStreamStatus] = useState<'idle' | 'creating' | 'waiting' | 'live' | 'ended'>('idle');
  const { toast } = useToast();

  const checkEligibility = async () => {
    try {
      // Check if user is admin first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Call has_role with explicit type casting
      const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin' as Database['public']['Enums']['app_role']
      });
      
      // Log any errors for debugging
      if (adminError) {
        console.error('Admin check error:', adminError);
      }
      
      // If admin check succeeded and user is admin, grant immediate access
      if (isAdmin === true) {
        console.log('✅ Admin access granted for user:', user.id);
        return {
          canStream: true,
          isAdmin: true,
          minutesRemaining: 999999,
          message: 'Admin access granted'
        };
      }
      
      console.log('User is not admin, checking artist subscription...');

      const { data: artist, error } = await supabase
        .from('artists')
        .select('subscription_tier, streaming_minutes_used, streaming_minutes_included')
        .eq('id', artistId)
        .single();

      if (error) throw error;

      if (artist.subscription_tier !== 'trident') {
        return {
          canStream: false,
          reason: 'upgrade_required',
          message: 'Upgrade to Trident to go live!',
        };
      }

      const minutesRemaining = (artist.streaming_minutes_included || 0) - (artist.streaming_minutes_used || 0);
      
      if (minutesRemaining <= 0) {
        return {
          canStream: false,
          reason: 'no_minutes',
          message: 'Purchase more streaming time to continue',
        };
      }

      return {
        canStream: true,
        minutesRemaining,
      };
    } catch (error) {
      console.error('Eligibility check error:', error);
      return {
        canStream: false,
        reason: 'error',
        message: 'Failed to check streaming eligibility',
      };
    }
  };

  const createStream = async (config: StreamConfig) => {
    setCreating(true);
    setStreamStatus('creating');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Check eligibility first
      const eligibility = await checkEligibility();
      if (!eligibility.canStream) {
        toast({
          title: "Cannot Start Stream",
          description: eligibility.message,
          variant: "destructive",
        });
        setStreamStatus('idle');
        return null;
      }

      const response = await supabase.functions.invoke('livepush-api', {
        body: { 
          action: 'create-live-stream',
          artistId,
          title: config.title,
          description: config.description,
          thumbnailUrl: config.thumbnailUrl,
          scheduledStart: config.scheduledStart,
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
        const errorMessage = response.data.message || 'Failed to create stream';
        const errorDetails = response.data.details;
        
        // Log detailed error for debugging
        console.error('Stream creation error:', {
          error: response.data.error,
          message: errorMessage,
          details: errorDetails
        });
        
        throw new Error(errorMessage);
      }

      const credentials: StreamCredentials = {
        streamId: response.data.stream_id,
        rtmpUrl: response.data.rtmp_url,
        streamKey: response.data.stream_key,
        hlsPlaybackUrl: response.data.hls_playback_url,
        livepushStreamId: response.data.livepush_stream_id,
      };

      setStream(credentials);
      setStreamStatus('waiting');

      toast({
        title: "Stream Created!",
        description: "Connect your streaming software to go live",
      });

      return credentials;
    } catch (error) {
      console.error('Create stream error:', error);
      
      // Extract a user-friendly error message
      let errorMessage = "Failed to create stream";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Stream Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setStreamStatus('idle');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const endStream = async (streamId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('livepush-api', {
        body: { 
          action: 'end-stream',
          streamId,
          artistId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      setStreamStatus('ended');
      setStream(null);

      toast({
        title: "Stream Ended",
        description: "Your recording will be available shortly",
      });

      return true;
    } catch (error) {
      console.error('End stream error:', error);
      toast({
        title: "Failed to End Stream",
        description: error instanceof Error ? error.message : "Failed to end stream",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    createStream,
    endStream,
    checkEligibility,
    stream,
    creating,
    streamStatus,
    setStreamStatus,
  };
};
