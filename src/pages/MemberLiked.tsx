import { useState, useEffect } from 'react';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Music, Video, Loader2 } from 'lucide-react';
import { useLikes } from '@/hooks/useLikes';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { LikeButton } from '@/components/member/LikeButton';

interface LikedContent {
  id: string;
  title: string;
  artist_name: string;
  artist_slug: string;
  artist_id: string;
  thumb_url?: string;
  video_url?: string;
  audio_url?: string;
  duration?: number;
  content_type: 'video' | 'audio';
  liked_at: string;
}

export default function MemberLiked() {
  const { getLikedContent, loading: likesLoading } = useLikes();
  const [likedVideos, setLikedVideos] = useState<LikedContent[]>([]);
  const [likedAudio, setLikedAudio] = useState<LikedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTracks } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    loadLikedContent();
  }, []);

  const loadLikedContent = async () => {
    setLoading(true);
    try {
      const [videoLikes, audioLikes] = await Promise.all([
        getLikedContent('video'),
        getLikedContent('audio')
      ]);

      // Fetch video details
      if (videoLikes.length > 0) {
        const videoIds = videoLikes.map(like => like.content_id);
        const { data: videos } = await supabase
          .from('videos')
          .select(`
            id,
            title,
            thumb_url,
            video_url,
            duration,
            artist_id,
            artists!fk_videos_artist (
              display_name,
              slug
            )
          `)
          .in('id', videoIds);

        if (videos) {
          const likedVideosData = videos.map((video: any) => ({
            id: video.id,
            title: video.title,
            artist_name: video.artists?.display_name || 'Unknown',
            artist_slug: video.artists?.slug || '',
            artist_id: video.artist_id,
            thumb_url: video.thumb_url,
            video_url: video.video_url,
            duration: video.duration,
            content_type: 'video' as const,
            liked_at: videoLikes.find(l => l.content_id === video.id)?.created_at || ''
          }));
          setLikedVideos(likedVideosData);
        }
      }

      // Fetch audio details
      if (audioLikes.length > 0) {
        const audioIds = audioLikes.map(like => like.content_id);
        const { data: audioTracks } = await supabase
          .from('audio_tracks')
          .select(`
            id,
            title,
            thumb_url,
            audio_url,
            duration,
            artist_id,
            artists!fk_audio_tracks_artist (
              display_name,
              slug
            )
          `)
          .in('id', audioIds);

        if (audioTracks) {
          const likedAudioData = audioTracks.map((audio: any) => ({
            id: audio.id,
            title: audio.title,
            artist_name: audio.artists?.display_name || 'Unknown',
            artist_slug: audio.artists?.slug || '',
            artist_id: audio.artist_id,
            thumb_url: audio.thumb_url,
            audio_url: audio.audio_url,
            duration: audio.duration,
            content_type: 'audio' as const,
            liked_at: audioLikes.find(l => l.content_id === audio.id)?.created_at || ''
          }));
          setLikedAudio(likedAudioData);
        }
      }
    } catch (error) {
      console.error('Error loading liked content:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayContent = (content: LikedContent, allContent: LikedContent[]) => {
    const tracks = allContent.map(c => ({
      id: c.id,
      title: c.title,
      artist_name: c.artist_name,
      artist_id: c.artist_id,
      artist_slug: c.artist_slug,
      thumbnail_url: c.thumb_url || '',
      video_url: c.video_url || c.audio_url || '',
      duration: c.duration || 0,
    }));
    
    const index = allContent.findIndex(c => c.id === content.id);
    playTracks(tracks, index);
  };

  const ContentCard = ({ content, allContent }: { content: LikedContent; allContent: LikedContent[] }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all"
      onClick={() => handlePlayContent(content, allContent)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative w-32 h-20 flex-shrink-0">
            {content.thumb_url ? (
              <img
                src={content.thumb_url}
                alt={content.title}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                {content.content_type === 'video' ? (
                  <Video className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <Music className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate mb-1">{content.title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (content.artist_slug) {
                  navigate(`/${content.artist_slug}`);
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground truncate mb-2 block"
            >
              {content.artist_name}
            </button>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {formatDuration(content.duration)}
              </Badge>
              <div onClick={(e) => e.stopPropagation()}>
                <LikeButton
                  contentId={content.id}
                  contentType={content.content_type}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-16">
      <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No liked {type} yet</h3>
      <p className="text-muted-foreground mb-6">
        Start liking content to build your collection
      </p>
      <Button onClick={() => navigate('/browse')}>Browse Catalog</Button>
    </div>
  );

  if (loading || likesLoading) {
    return (
      <MemberLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MemberLayout>
    );
  }

  const allLiked = [...likedVideos, ...likedAudio].sort((a, b) => 
    new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime()
  );

  return (
    <MemberLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Liked Content</h1>
          <p className="text-muted-foreground">
            Your collection of favorite videos and audio tracks
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">
              All ({allLiked.length})
            </TabsTrigger>
            <TabsTrigger value="videos">
              Videos ({likedVideos.length})
            </TabsTrigger>
            <TabsTrigger value="audio">
              Audio ({likedAudio.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {allLiked.length === 0 ? (
              <EmptyState type="content" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allLiked.map((content) => (
                  <ContentCard key={content.id} content={content} allContent={allLiked} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            {likedVideos.length === 0 ? (
              <EmptyState type="videos" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {likedVideos.map((content) => (
                  <ContentCard key={content.id} content={content} allContent={likedVideos} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio" className="mt-6">
            {likedAudio.length === 0 ? (
              <EmptyState type="audio" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {likedAudio.map((content) => (
                  <ContentCard key={content.id} content={content} allContent={likedAudio} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MemberLayout>
  );
}
