import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Music, Search } from 'lucide-react';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import { useToast } from '@/hooks/use-toast';
import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';

interface CatalogItem {
  id: string;
  title: string;
  kind: string;
  thumb_url?: string;
  duration?: number;
  artist_id: string;
  artist_name: string;
  artist_slug: string;
  content_type: 'video' | 'audio';
  video_url?: string;
  audio_url?: string;
}

interface CatalogBrowserProps {
  mode?: 'standalone' | 'selection';
  onSelect?: (videoIds: string[]) => void;
  excludeVideoIds?: string[];
  multiSelect?: boolean;
  contentFilter?: 'all' | 'video' | 'audio';
  sceneFilter?: string;
}

export const CatalogBrowser = ({
  mode = 'standalone',
  onSelect,
  excludeVideoIds = [],
  multiSelect = true,
  contentFilter = 'all',
  sceneFilter
}: CatalogBrowserProps) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(contentFilter);
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { playTracks } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog();
  }, [searchQuery, typeFilter, kindFilter, sortBy, sceneFilter]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const allItems: CatalogItem[] = [];

      // Fetch videos if needed
      if (typeFilter === 'all' || typeFilter === 'video') {
        let videoQuery = supabase
          .from('videos')
          .select(`
            id,
            title,
            kind,
            thumb_url,
            video_url,
            duration,
            artist_id,
            artists!fk_videos_artist (
              display_name,
              slug,
              scene,
              port_settings!inner (
                publish_status
              )
            )
          `)
          .eq('status', 'ready')
          .not('published_at', 'is', null)
          .eq('artists.port_settings.publish_status', 'published');

        // Apply scene filter
        if (sceneFilter) {
          videoQuery = videoQuery.eq('artists.scene', sceneFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
          videoQuery = videoQuery.or(`title.ilike.%${searchQuery}%,artists.display_name.ilike.%${searchQuery}%`);
        }

        // Apply kind filter for videos
        if (kindFilter !== 'all') {
          videoQuery = videoQuery.eq('kind', kindFilter as any);
        }

        const { data: videosData, error: videosError } = await videoQuery.limit(100);

        if (videosError) throw videosError;

        const transformedVideos = videosData?.map((video: any) => ({
          id: video.id,
          title: video.title,
          kind: video.kind,
          thumb_url: video.thumb_url,
          video_url: video.video_url,
          duration: video.duration,
          artist_id: video.artist_id,
          artist_name: video.artists?.display_name || 'Unknown Artist',
          artist_slug: video.artists?.slug || '',
          content_type: 'video' as const
        })) || [];

        allItems.push(...transformedVideos);
      }

      // Fetch audio tracks if needed
      if (typeFilter === 'all' || typeFilter === 'audio') {
        let audioQuery = supabase
          .from('audio_tracks')
          .select(`
            id,
            title,
            thumb_url,
            audio_url,
            duration,
            artist_id,
            published_at,
            artists!fk_audio_tracks_artist (
              display_name,
              slug,
              scene,
              port_settings!inner (
                publish_status
              )
            )
          `)
          .eq('status', 'active')
          .not('published_at', 'is', null)
          .eq('artists.port_settings.publish_status', 'published');

        // Apply scene filter
        if (sceneFilter) {
          audioQuery = audioQuery.eq('artists.scene', sceneFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
          audioQuery = audioQuery.or(`title.ilike.%${searchQuery}%,artists.display_name.ilike.%${searchQuery}%`);
        }

        const { data: audioData, error: audioError } = await audioQuery.limit(100);

        if (audioError) throw audioError;

        const transformedAudio = audioData?.map((audio: any) => ({
          id: audio.id,
          title: audio.title,
          kind: 'audio',
          thumb_url: audio.thumb_url,
          audio_url: audio.audio_url,
          duration: audio.duration,
          artist_id: audio.artist_id,
          artist_name: audio.artists?.display_name || 'Unknown Artist',
          artist_slug: audio.artists?.slug || '',
          content_type: 'audio' as const
        })) || [];

        allItems.push(...transformedAudio);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          allItems.sort((a, b) => b.id.localeCompare(a.id));
          break;
        case 'oldest':
          allItems.sort((a, b) => a.id.localeCompare(b.id));
          break;
        case 'title':
          allItems.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      // Filter out excluded items
      const filteredItems = allItems.filter(
        item => !excludeVideoIds.includes(item.id)
      );

      setItems(filteredItems);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      toast({
        title: "Error",
        description: "Failed to load catalog",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectToggle = (videoId: string) => {
    if (!multiSelect) {
      setSelectedIds([videoId]);
      return;
    }

    setSelectedIds(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleConfirmSelection = () => {
    if (onSelect && selectedIds.length > 0) {
      onSelect(selectedIds);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getKindLabel = (kind: string) => {
    const labels: Record<string, string> = {
      music_video: 'Music Video',
      audio_only: 'Audio',
      audio: 'Audio Track',
      performance_clip: 'Performance',
      lyric_video: 'Lyric Video',
      behind_the_scenes: 'BTS',
      interview: 'Interview',
      other: 'Other'
    };
    return labels[kind] || kind;
  };

  const handleItemClick = (item: CatalogItem, index: number) => {
    console.log('Item clicked:', { 
      title: item.title, 
      artist_name: item.artist_name,
      artist_slug: item.artist_slug 
    });
    
    if (mode === 'standalone') {
      // Convert all items to Track format
      const tracks = items.map(i => ({
        id: i.id,
        title: i.title,
        artist_name: i.artist_name,
        artist_id: i.artist_id,
        artist_slug: i.artist_slug,
        thumbnail_url: i.thumb_url || '',
        video_url: i.video_url || i.audio_url || '',
        duration: i.duration || 0,
      }));
      
      console.log('Tracks to play:', tracks[index]);
      
      // Play starting from clicked track
      playTracks(tracks, index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="video">Video Only</SelectItem>
            <SelectItem value="audio">Audio Only</SelectItem>
          </SelectContent>
        </Select>
        {typeFilter !== 'audio' && (
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Video type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Video Types</SelectItem>
              <SelectItem value="music_video">Music Videos</SelectItem>
              <SelectItem value="audio_only">Audio Only</SelectItem>
              <SelectItem value="performance_clip">Performances</SelectItem>
              <SelectItem value="lyric_video">Lyric Videos</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selection mode controls */}
      {mode === 'selection' && (
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.length === items.length && items.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
          </div>
          <Button
            onClick={handleConfirmSelection}
            disabled={selectedIds.length === 0}
            size="sm"
          >
            Add Selected
          </Button>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No content found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {items.map((item, index) => (
            <Card
              key={item.id}
              className={`p-4 transition-all ${
                mode === 'selection' 
                  ? selectedIds.includes(item.id) ? 'ring-2 ring-primary' : ''
                  : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
              }`}
              onClick={() => mode === 'standalone' && handleItemClick(item, index)}
            >
              <div className="flex gap-3">
                {mode === 'selection' && (
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => handleSelectToggle(item.id)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {/* Thumbnail placeholder or image */}
                  {item.thumb_url ? (
                    <img
                      src={item.thumb_url}
                      alt={item.title}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <h3 className="font-semibold text-sm truncate mb-1">
                    {item.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.artist_slug) {
                        navigate(`/port/${item.artist_slug}`);
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground truncate mb-2 text-left w-full disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!item.artist_slug}
                  >
                    {item.artist_name}
                  </button>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getKindLabel(item.kind)}
                      </Badge>
                      {item.duration && (
                        <Badge variant="outline" className="text-xs">
                          {formatDuration(item.duration)}
                        </Badge>
                      )}
                    </div>

                    {mode === 'standalone' && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AddToPlaylistButton
                          videoId={item.content_type === 'video' ? item.id : undefined}
                          audioId={item.content_type === 'audio' ? item.id : undefined}
                          variant="inline"
                          className="h-7 text-xs px-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
