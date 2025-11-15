import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExternalLink, RefreshCw, Eye, Heart, MessageCircle, Share2 } from "lucide-react";

interface TikTokVideo {
  id: string;
  title: string;
  cover_image_url: string;
  share_url: string;
  video_description?: string;
  duration: number;
  create_time: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
}

export const TikTokVideoList = () => {
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVideos = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('fetch-tiktok-videos');

      if (error) throw error;

      if (data.success) {
        setVideos(data.videos || []);
      } else {
        throw new Error(data.error || 'Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching TikTok videos:', error);
      toast.error('Failed to load TikTok videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My TikTok Videos</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchVideos}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No TikTok videos found</p>
            <p className="text-sm mt-2">Upload videos to TikTok to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative aspect-[9/16] bg-muted">
                  <img
                    src={video.cover_image_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2">
                    {formatDuration(video.duration)}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(video.view_count)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatNumber(video.like_count)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatNumber(video.comment_count)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {formatNumber(video.share_count)}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(video.share_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View on TikTok
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
