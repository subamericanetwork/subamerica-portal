import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StreamOverlay } from "./StreamOverlay";
import Hls from "hls.js";

interface OverlayData {
  overlay_id: string;
  type: string;
  trigger_time: number;
  duration: number;
  position: string;
  clickable: boolean;
  data: any;
  click_action: any;
  platforms: string[];
  priority: number;
}

interface StreamOverlayManagerProps {
  streamId: string;
  videoElement: HTMLVideoElement | null;
  hlsInstance?: Hls | null;
  platform?: string;
}

export function StreamOverlayManager({ 
  streamId, 
  videoElement, 
  hlsInstance,
  platform = 'web' 
}: StreamOverlayManagerProps) {
  const [activeOverlays, setActiveOverlays] = useState<OverlayData[]>([]);
  const [allOverlays, setAllOverlays] = useState<OverlayData[]>([]);
  const sessionIdRef = useRef(crypto.randomUUID());
  const trackedViewsRef = useRef<Set<string>>(new Set());

  // Fetch overlays for this stream
  useEffect(() => {
    const fetchOverlays = async () => {
      const { data, error } = await supabase
        .from('stream_overlays')
        .select('*')
        .eq('stream_id', streamId)
        .contains('platforms', [platform])
        .order('trigger_time_seconds', { ascending: true });

      if (error) {
        console.error('Error fetching overlays:', error);
        return;
      }

      const formatted = (data || []).map(overlay => ({
        overlay_id: overlay.id,
        type: overlay.overlay_type,
        trigger_time: overlay.trigger_time_seconds,
        duration: overlay.duration_seconds,
        position: overlay.position,
        clickable: overlay.clickable,
        data: overlay.content_data,
        click_action: overlay.click_action,
        platforms: overlay.platforms,
        priority: overlay.priority
      }));

      setAllOverlays(formatted);
    };

    fetchOverlays();
  }, [streamId, platform]);

  // Listen to HLS.js metadata events
  useEffect(() => {
    if (!hlsInstance || !Hls.isSupported()) return;

    const handleMetadata = (event: string, data: any) => {
      if (data.samples) {
        data.samples.forEach((sample: any) => {
          try {
            // Parse ID3 frames
            const frames = parseID3Frames(sample.data);
            frames.forEach(frame => {
              if (frame.description === 'SUBAMERICA_OVERLAY') {
                const overlayData = JSON.parse(frame.value);
                showOverlay(overlayData);
              }
            });
          } catch (error) {
            console.error('Error parsing metadata:', error);
          }
        });
      }
    };

    hlsInstance.on(Hls.Events.FRAG_PARSING_METADATA, handleMetadata);

    return () => {
      hlsInstance.off(Hls.Events.FRAG_PARSING_METADATA, handleMetadata);
    };
  }, [hlsInstance]);

  // Listen to native HLS metadata (Safari)
  useEffect(() => {
    if (!videoElement || Hls.isSupported()) return;

    const handleCueChange = () => {
      const track = videoElement.textTracks[0];
      if (!track) return;

      const cue = track.activeCues?.[0] as any;
      if (cue?.value?.key === 'SUBAMERICA_OVERLAY') {
        try {
          const overlayData = JSON.parse(cue.value.data);
          showOverlay(overlayData);
        } catch (error) {
          console.error('Error parsing native HLS metadata:', error);
        }
      }
    };

    const track = videoElement.textTracks[0];
    if (track) {
      track.addEventListener('cuechange', handleCueChange);
      return () => track.removeEventListener('cuechange', handleCueChange);
    }
  }, [videoElement]);

  // Time-based overlay triggering (fallback for streams without ID3 metadata)
  useEffect(() => {
    if (!videoElement || allOverlays.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = Math.floor(videoElement.currentTime);
      
      // Find overlays that should be shown now
      const overlaysToShow = allOverlays.filter(overlay => {
        const isAtTriggerTime = currentTime === overlay.trigger_time;
        const notCurrentlyActive = !activeOverlays.find(a => a.overlay_id === overlay.overlay_id);
        return isAtTriggerTime && notCurrentlyActive;
      });

      overlaysToShow.forEach(overlay => showOverlay(overlay));
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoElement, allOverlays, activeOverlays]);

  const showOverlay = (overlayData: OverlayData) => {
    // Track view impression
    if (!trackedViewsRef.current.has(overlayData.overlay_id)) {
      trackInteraction(overlayData.overlay_id, 'view');
      trackedViewsRef.current.add(overlayData.overlay_id);
    }

    // Add to active overlays
    setActiveOverlays(prev => {
      // Remove any existing overlay with same ID
      const filtered = prev.filter(o => o.overlay_id !== overlayData.overlay_id);
      // Add new overlay, sorted by priority
      return [...filtered, overlayData].sort((a, b) => b.priority - a.priority);
    });

    // Auto-hide after duration
    setTimeout(() => {
      hideOverlay(overlayData.overlay_id);
    }, overlayData.duration * 1000);
  };

  const hideOverlay = (overlayId: string) => {
    setActiveOverlays(prev => prev.filter(o => o.overlay_id !== overlayId));
  };

  const handleOverlayClick = (overlayId: string) => {
    trackInteraction(overlayId, 'click');
  };

  const handleOverlayDismiss = (overlayId: string) => {
    trackInteraction(overlayId, 'dismiss');
    hideOverlay(overlayId);
  };

  const trackInteraction = async (overlayId: string, interactionType: 'view' | 'click' | 'dismiss') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.functions.invoke('track-overlay-interaction', {
        body: {
          overlay_id: overlayId,
          stream_id: streamId,
          interaction_type: interactionType,
          platform,
          session_id: sessionIdRef.current,
          user_id: user?.id || null
        }
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const parseID3Frames = (data: ArrayBuffer): Array<{ description: string; value: string }> => {
    // Simplified ID3 TXXX frame parser
    // In production, use a proper ID3 parsing library
    const frames: Array<{ description: string; value: string }> = [];
    
    try {
      const view = new DataView(data);
      const decoder = new TextDecoder('utf-8');
      
      // This is a simplified parser - actual ID3 parsing is more complex
      // For production, consider using a library like id3-parser
      const text = decoder.decode(data);
      
      if (text.includes('SUBAMERICA_OVERLAY')) {
        // Extract JSON payload
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonData = text.substring(jsonStart, jsonEnd);
          frames.push({
            description: 'SUBAMERICA_OVERLAY',
            value: jsonData
          });
        }
      }
    } catch (error) {
      console.error('Error parsing ID3:', error);
    }

    return frames;
  };

  if (activeOverlays.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {activeOverlays.map(overlay => (
        <StreamOverlay
          key={overlay.overlay_id}
          overlay={overlay}
          onClose={() => handleOverlayDismiss(overlay.overlay_id)}
          onClick={() => handleOverlayClick(overlay.overlay_id)}
        />
      ))}
    </div>
  );
}