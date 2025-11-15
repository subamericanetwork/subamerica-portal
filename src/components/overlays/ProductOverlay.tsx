import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react";

interface ProductOverlayProps {
  data: {
    product_id: string;
    name: string;
    price: number;
    currency: string;
    image_url?: string;
    thumbnail_url?: string;
  };
  clickAction?: {
    type: string;
    url: string;
  };
}

export function ProductOverlay({ data, clickAction }: ProductOverlayProps) {
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickAction?.url) {
      window.open(clickAction.url, '_blank');
    }
  };

  return (
    <Card className="bg-background/95 backdrop-blur-sm border-primary/20 p-4 max-w-sm shadow-xl">
      <div className="flex gap-4">
        {(data.thumbnail_url || data.image_url) && (
          <img
            src={data.thumbnail_url || data.image_url}
            alt={data.name}
            className="w-20 h-20 object-cover rounded-md"
          />
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{data.name}</h4>
          <p className="text-2xl font-bold text-primary mb-2">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: data.currency || 'USD'
            }).format(data.price)}
          </p>
          <Button
            size="sm"
            onClick={handleBuyNow}
            className="w-full"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </div>
    </Card>
  );
}