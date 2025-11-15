import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Heart, Star, ArrowRight } from "lucide-react";

interface CTAOverlayProps {
  data: {
    message: string;
    button_text: string;
    button_color?: string;
    icon?: string;
  };
  clickAction?: {
    type: string;
    url: string;
  };
}

export function CTAOverlay({ data, clickAction }: CTAOverlayProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickAction?.url) {
      window.open(clickAction.url, '_blank');
    }
  };

  const getIcon = () => {
    const icons = {
      bell: <Bell className="w-4 h-4" />,
      heart: <Heart className="w-4 h-4" />,
      star: <Star className="w-4 h-4" />,
      arrow: <ArrowRight className="w-4 h-4" />
    };
    return icons[data.icon as keyof typeof icons] || <ArrowRight className="w-4 h-4" />;
  };

  return (
    <Card className="bg-background/95 backdrop-blur-sm border-primary/20 p-4 max-w-md shadow-xl">
      <p className="text-sm mb-3 text-center">{data.message}</p>
      <Button
        onClick={handleClick}
        className="w-full"
        style={data.button_color ? { backgroundColor: data.button_color } : undefined}
      >
        {getIcon()}
        <span className="ml-2">{data.button_text}</span>
      </Button>
    </Card>
  );
}