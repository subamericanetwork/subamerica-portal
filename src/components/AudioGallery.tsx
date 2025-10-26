import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ChevronDown, ChevronUp, Music2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  thumb_url: string | null;
  duration: number | null;
  is_featured: boolean;
}

interface AudioGalleryProps {
  artistId: string;
  artistName?: string;
  viewerDisplayName?: string;
  className?: string;
}

export function AudioGallery({ artistId, artistName, viewerDisplayName, className = '' }: AudioGalleryProps) {
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchAudioTracks = async () => {
      try {
        const { data, error } = await supabase
          .from('audio_tracks')
          .select('id, title, audio_url, thumb_url, duration, is_featured')
          .eq('artist_id', artistId)
          .not('published_at', 'is', null)
          .not('audio_url', 'is', null)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setAudioTracks(data || []);
      } catch (error) {
        console.error('Error fetching audio tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudioTracks();
  }, [artistId]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} id="audio">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Music2 className="h-6 w-6" />
          Audio Tracks
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (audioTracks.length === 0) {
    return null;
  }

  const visibleTracks = isExpanded ? audioTracks : audioTracks.slice(0, 3);
  const hasMore = audioTracks.length > 3;

  return (
    <div className={`space-y-4 ${className}`} id="audio">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Music2 className="h-6 w-6" />
        Audio Tracks ({audioTracks.length})
      </h2>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="space-y-3">
          {visibleTracks.map((track) => (
            <Card key={track.id} className="gradient-card overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                  {track.thumb_url ? (
                    <img 
                      src={track.thumb_url} 
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <AudioPlayer
                    audioUrl={track.audio_url}
                    title={track.title}
                    contentId={track.id}
                    artistName={artistName}
                    viewerName={viewerDisplayName}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {hasMore && (
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full mt-4"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show More ({audioTracks.length - 3} more tracks)
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        )}
      </Collapsible>
    </div>
  );
}
