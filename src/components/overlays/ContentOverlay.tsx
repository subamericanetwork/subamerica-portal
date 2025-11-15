import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Music } from "lucide-react";

interface ContentOverlayProps {
  data: {
    content_type: 'video' | 'audio' | 'post';
    content_id: string;
    title: string;
    thumbnail_url?: string;
    description?: string;
  };
  clickAction?: {
    type: string;
    url: string;
  };
}

export function ContentOverlay({ data, clickAction }: ContentOverlayProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickAction?.url) {
      window.open(clickAction.url, '_blank');
    }
  };

  const getIcon = () => {
    switch (data.content_type) {
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'video':
      case 'post':
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getButtonText = () => {
    switch (data.content_type) {
      case 'audio':
        return 'Listen Now';
      case 'video':
        return 'Watch Now';
      case 'post':
        return 'View Post';
      default:
        return 'View';
    }
  };

  return (
    <Card className="bg-background/95 backdrop-blur-sm border-primary/20 p-4 max-w-sm shadow-xl">
      <div className="flex gap-4">
        {data.thumbnail_url && (
          <img
            src={data.thumbnail_url}
            alt={data.title}
            className="w-20 h-20 object-cover rounded-md"
          />
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{data.title}</h4>
          {data.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {data.description}
            </p>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleClick}
            className="w-full"
          >
            {getIcon()}
            <span className="ml-2">{getButtonText()}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}