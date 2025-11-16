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
  streamingMode: 'own_account' | 'subamerica_managed';
  provider?: 'mux' | 'livepush';
  showOnTv?: boolean;
  showOnWeb?: boolean;
}

export const useGoLive = (artistId: string) => {
  const [creating, setCreating] = useState(false);
  const [stream, setStream] = useState<StreamCredentials | null>(null);
  const [streamStatus, setStreamStatus] = useState<'idle' | 'creating' | 'waiting' | 'live' | 'ended'>('idle');
  const { toast } = useToast();

  // Poll stream status every 10 seconds when waiting for stream
  const pollStreamStatus = async (streamId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-stream-status', {
        body: { streamId },
      });

      if (error) throw error;

      if (data?.synced) {
        console.log('Stream status updated:', data.newStatus);
        
        // Update local status
        if (data.newStatus === 'live') {
          setStreamStatus('live');
        } else if (data.newStatus === 'ended') {
          setStreamStatus('ended');
        }
      }
    } catch (error) {
      console.error('Error polling stream status:', error);
    }
  };

  const checkEligibility = async (streamingMode?: 'own_account' | 'subamerica_managed') => {
    try {
      // For own_account mode, just check if credentials exist
      if (streamingMode === 'own_account') {
        const { data: credentials } = await supabase
          .from('artist_streaming_credentials')
          .select('provider, is_active')
          .eq('artist_id', artistId)
          .eq('is_active', true)
          .maybeSingle();

        if (!credentials) {
          return {
            canStream: false,
            reason: 'no_credentials',
            message: 'Please connect your streaming account first',
          };
        }

        return {
          canStream: true,
          minutesRemaining: 999999, // No limits for own account
          message: 'Using your own streaming account',
        };
      }

      // For subamerica_managed mode, check admin OR (trident + minutes)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin' as Database['public']['Enums']['app_role']
      });
      
      if (adminError) {
        console.error('Admin check error:', adminError);
      }
      
      if (isAdmin === true) {
        console.log('✅ Admin access granted for user:', user.id);
        return {
          canStream: true,
          isAdmin: true,
          minutesRemaining: 999999,
          message: 'Admin access granted'
        };
      }

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
          streaming_mode: config.streamingMode,
          provider: config.provider,
          show_on_tv: config.showOnTv,
          show_on_web: config.showOnWeb,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Check for network/auth errors first
      if (response.error) {
        throw new Error('Network error or authentication failed');
      }

      // Check if the response contains an application error
      if (!response.data?.success || response.data?.error) {
        const errorType = response.data?.error || 'unknown';
        const errorMessage = response.data?.message || 'Failed to create stream';
        
        // Log detailed error for debugging
        console.error('Stream creation error:', {
          error: errorType,
          message: errorMessage,
          details: response.data?.details
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
      
      // Start polling for status changes
      const pollInterval = setInterval(() => {
        pollStreamStatus(credentials.streamId);
      }, 10000); // Poll every 10 seconds

      // Store interval ID so we can clear it later
      (credentials as any).pollInterval = pollInterval;

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
      // Clear polling interval if it exists
      if (stream && (stream as any).pollInterval) {
        clearInterval((stream as any).pollInterval);
      }

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
