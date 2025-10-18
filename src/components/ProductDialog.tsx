import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProductVariant {
  size?: string;
  color?: string;
  stock?: number;
}

interface Product {
  id: string;
  title: string;
  type: string;
  price: number | null;
  description: string | null;
  long_description?: string | null;
  images: string[] | null;
  link: string | null;
  payment_type: string | null;
  stripe_price_id: string | null;
  currency: string | null;
  variants?: ProductVariant[] | null;
}

interface ProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase?: (priceId: string, type: 'event' | 'product', productId: string) => void;
  purchasingItem?: string | null;
}

export function ProductDialog({ product, open, onOpenChange, onPurchase, purchasingItem }: ProductDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  const images = product.images || [];
  const isApparel = product.type?.toLowerCase() === "apparel";
  const variants = product.variants as ProductVariant[] | null;

  // Extract unique sizes and colors from variants
  const sizes = variants ? [...new Set(variants.map(v => v.size).filter(Boolean))] : [];
  const colors = variants ? [...new Set(variants.map(v => v.color).filter(Boolean))] : [];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleBuyNow = () => {
    if (product.payment_type === "stripe" && product.stripe_price_id && onPurchase) {
      onPurchase(product.stripe_price_id, 'product', product.id);
    } else if (product.link) {
      window.open(product.link, '_blank');
    }
  };

  const canPurchase = !isApparel || (
    (!sizes.length || selectedSize) && 
    (!colors.length || selectedColor)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Images Section */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <>
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${product.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                        onClick={handlePrevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((image, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.title} - Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="space-y-4">
            {product.long_description && (
              <p className="text-muted-foreground whitespace-pre-wrap">{product.long_description}</p>
            )}

            {product.price && (
              <div className="text-2xl font-bold text-primary">
                ${product.price} {product.currency?.toUpperCase()}
              </div>
            )}

            {/* Size Selection for Apparel */}
            {isApparel && sizes.length > 0 && (
              <div className="space-y-2">
                <Label>Size</Label>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map((size) => (
                      <div key={size}>
                        <RadioGroupItem
                          value={size!}
                          id={`size-${size}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`size-${size}`}
                          className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Color Selection for Apparel */}
            {isApparel && colors.length > 0 && (
              <div className="space-y-2">
                <Label>Color</Label>
                <RadioGroup value={selectedColor} onValueChange={setSelectedColor}>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <div key={color}>
                        <RadioGroupItem
                          value={color!}
                          id={`color-${color}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`color-${color}`}
                          className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          {color}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Purchase Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleBuyNow}
              disabled={!canPurchase || purchasingItem === product.id}
            >
              {purchasingItem === product.id ? 'Processing...' : 
               product.payment_type === "stripe" ? 'Buy Now' : 'View on Store'}
            </Button>

            {isApparel && !canPurchase && (
              <p className="text-sm text-muted-foreground text-center">
                Please select {!selectedSize && sizes.length > 0 ? 'a size' : ''}{!selectedSize && !selectedColor && sizes.length > 0 && colors.length > 0 ? ' and ' : ''}{!selectedColor && colors.length > 0 ? 'a color' : ''}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
