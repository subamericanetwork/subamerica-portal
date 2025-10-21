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

interface Video {
  id: string;
  title: string;
  kind: string;
  thumb_url?: string;
  duration?: number;
  artist_id: string;
  artist_name: string;
  artist_slug: string;
}

interface CatalogBrowserProps {
  mode?: 'standalone' | 'selection';
  onSelect?: (videoIds: string[]) => void;
  excludeVideoIds?: string[];
  multiSelect?: boolean;
}

export const CatalogBrowser = ({
  mode = 'standalone',
  onSelect,
  excludeVideoIds = [],
  multiSelect = true
}: CatalogBrowserProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, [searchQuery, kindFilter, sortBy]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('videos')
        .select(`
          id,
          title,
          kind,
          thumb_url,
          duration,
          artist_id,
          artists!inner (
            display_name,
            slug,
            port_settings!inner (
              publish_status
            )
          )
        `)
        .eq('status', 'ready')
        .not('published_at', 'is', null)
        .eq('artists.port_settings.publish_status', 'published');

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,artists.display_name.ilike.%${searchQuery}%`);
      }

      // Apply kind filter
      if (kindFilter !== 'all') {
        query = query.eq('kind', kindFilter as any);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('published_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('published_at', { ascending: true });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Transform data to flat structure
      const transformedVideos = data?.map((video: any) => ({
        id: video.id,
        title: video.title,
        kind: video.kind,
        thumb_url: video.thumb_url,
        duration: video.duration,
        artist_id: video.artist_id,
        artist_name: video.artists.display_name,
        artist_slug: video.artists.slug
      })) || [];

      // Filter out excluded videos
      const filteredVideos = transformedVideos.filter(
        v => !excludeVideoIds.includes(v.id)
      );

      setVideos(filteredVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
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
    if (selectedIds.length === videos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(videos.map(v => v.id));
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
      performance_clip: 'Performance',
      lyric_video: 'Lyric Video',
      behind_the_scenes: 'BTS',
      interview: 'Interview',
      other: 'Other'
    };
    return labels[kind] || kind;
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
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="music_video">Music Videos</SelectItem>
            <SelectItem value="audio_only">Audio Only</SelectItem>
            <SelectItem value="performance_clip">Performances</SelectItem>
            <SelectItem value="lyric_video">Lyric Videos</SelectItem>
          </SelectContent>
        </Select>
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
              checked={selectedIds.length === videos.length && videos.length > 0}
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

      {/* Videos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No videos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {videos.map((video) => (
            <Card
              key={video.id}
              className={`p-4 hover:shadow-md transition-shadow ${
                mode === 'selection' && selectedIds.includes(video.id)
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
            >
              <div className="flex gap-3">
                {mode === 'selection' && (
                  <Checkbox
                    checked={selectedIds.includes(video.id)}
                    onCheckedChange={() => handleSelectToggle(video.id)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {/* Thumbnail placeholder or image */}
                  {video.thumb_url ? (
                    <img
                      src={video.thumb_url}
                      alt={video.title}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <h3 className="font-semibold text-sm truncate mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {video.artist_name}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getKindLabel(video.kind)}
                      </Badge>
                      {video.duration && (
                        <Badge variant="outline" className="text-xs">
                          {formatDuration(video.duration)}
                        </Badge>
                      )}
                    </div>

                    {mode === 'standalone' && (
                      <AddToPlaylistButton
                        videoId={video.id}
                        variant="inline"
                        className="h-7 text-xs px-2"
                      />
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
