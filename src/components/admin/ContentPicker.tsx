import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Video, Music, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumb_url?: string;
  duration?: number;
  content_type: 'video' | 'audio' | 'post';
}

interface ContentPickerProps {
  artistId: string;
  onSelect: (content: {
    content_type: string;
    content_id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
  }) => void;
  selectedContentId?: string;
}

export function ContentPicker({ artistId, onSelect, selectedContentId }: ContentPickerProps) {
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [audio, setAudio] = useState<ContentItem[]>([]);
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('videos');
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, [artistId, searchQuery]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch videos
      let videoQuery = supabase
        .from('videos')
        .select('id, title, description, thumb_url, duration')
        .eq('artist_id', artistId)
        .eq('status', 'ready')
        .not('published_at', 'is', null);

      if (searchQuery.trim()) {
        videoQuery = videoQuery.ilike('title', `%${searchQuery}%`);
      }

      const { data: videosData } = await videoQuery.order('created_at', { ascending: false }).limit(50);
      setVideos((videosData || []).map((v: any) => ({ 
        id: v.id,
        title: v.title,
        description: v.description,
        thumb_url: v.thumb_url,
        duration: v.duration,
        content_type: 'video' as const 
      })));

      // Fetch audio
      let audioQuery = supabase
        .from('audio_tracks')
        .select('id, title, description, thumb_url, duration')
        .eq('artist_id', artistId)
        .eq('status', 'published')
        .not('published_at', 'is', null);

      if (searchQuery.trim()) {
        audioQuery = audioQuery.ilike('title', `%${searchQuery}%`);
      }

      const { data: audioData } = await audioQuery.order('created_at', { ascending: false }).limit(50);
      setAudio((audioData || []).map((a: any) => ({ 
        id: a.id,
        title: a.title,
        description: a.description,
        thumb_url: a.thumb_url,
        duration: a.duration,
        content_type: 'audio' as const 
      })));

      // Fetch posts
      let postQuery = supabase
        .from('artist_posts')
        .select('id, title, caption, media_url')
        .eq('artist_id', artistId)
        .eq('publish_status', 'published');

      if (searchQuery.trim()) {
        postQuery = postQuery.ilike('title', `%${searchQuery}%`);
      }

      const { data: postsData } = await postQuery.order('created_at', { ascending: false }).limit(50);
      setPosts((postsData || []).map((p: any) => ({ 
        id: p.id,
        title: p.title,
        description: p.caption,
        thumb_url: p.media_url,
        content_type: 'post' as const
      })));

    } catch (error: any) {
      toast({
        title: "Error loading content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: ContentItem) => {
    onSelect({
      content_type: item.content_type,
      content_id: item.id,
      title: item.title,
      description: item.description,
      thumbnail_url: item.thumb_url,
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = (items: ContentItem[], icon: any) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          {icon}
          <p className="text-muted-foreground mt-4">No content found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {items.map((item) => {
          const isSelected = selectedContentId === item.id;
          return (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSelect(item)}
            >
              <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                {item.thumb_url ? (
                  <img
                    src={item.thumb_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {icon}
                  </div>
                )}
                {item.duration && (
                  <div className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 rounded text-xs">
                    {formatDuration(item.duration)}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
          <TabsTrigger value="audio">Audio ({audio.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="mt-4">
          {renderContent(videos, <Video className="h-12 w-12 text-muted-foreground" />)}
        </TabsContent>
        
        <TabsContent value="audio" className="mt-4">
          {renderContent(audio, <Music className="h-12 w-12 text-muted-foreground" />)}
        </TabsContent>
        
        <TabsContent value="posts" className="mt-4">
          {renderContent(posts, <FileText className="h-12 w-12 text-muted-foreground" />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
