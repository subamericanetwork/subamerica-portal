import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart, MessageCircle, Share2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialPost {
  id: string;
  platform: string;
  caption?: string;
  media_url?: string;
  permalink?: string;
  posted_at: string;
  social_analytics?: Array<{
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  }>;
}

interface SocialPostsGridProps {
  posts: SocialPost[];
}

export const SocialPostsGrid = ({ posts }: SocialPostsGridProps) => {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Eye className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Connect your Instagram or Facebook account to start syncing your posts and analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const analytics = post.social_analytics?.[0];
        return (
          <Card key={post.id} className="overflow-hidden group">
            <div className="relative aspect-square bg-muted">
              {post.media_url ? (
                <img
                  src={post.media_url}
                  alt={post.caption?.substring(0, 50) || "Post"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="capitalize">
                  {post.platform}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              {post.caption && (
                <p className="text-sm mb-3 line-clamp-2">{post.caption}</p>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                {analytics?.impressions !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {analytics.impressions.toLocaleString()}
                  </div>
                )}
                {analytics?.likes !== undefined && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {analytics.likes.toLocaleString()}
                  </div>
                )}
                {analytics?.comments !== undefined && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {analytics.comments.toLocaleString()}
                  </div>
                )}
                {analytics?.shares !== undefined && (
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {analytics.shares.toLocaleString()}
                  </div>
                )}
              </div>

              {post.permalink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(post.permalink, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Post
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
