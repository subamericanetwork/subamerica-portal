import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";

interface InfoOverlayProps {
  data: {
    artist_name?: string;
    avatar_url?: string;
    bio?: string;
    social_links?: Array<{ platform: string; url: string }>;
  };
  clickAction?: {
    type: string;
    url: string;
  };
}

export function InfoOverlay({ data, clickAction }: InfoOverlayProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickAction?.url) {
      window.open(clickAction.url, '_blank');
    }
  };

  return (
    <Card className="bg-background/95 backdrop-blur-sm border-primary/20 p-4 max-w-sm shadow-xl">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={data.avatar_url} alt={data.artist_name} />
          <AvatarFallback>{data.artist_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{data.artist_name}</h4>
          {data.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {data.bio}
            </p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleClick}
        className="w-full"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Visit Artist Port
      </Button>
    </Card>
  );
}