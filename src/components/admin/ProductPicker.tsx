import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Search, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: any;
  artist_id: string;
}

interface ProductPickerProps {
  artistId: string;
  onSelect: (product: {
    product_id: string;
    name: string;
    price: number;
    currency: string;
    image_url?: string;
    thumbnail_url?: string;
  }) => void;
  selectedProductId?: string;
}

export function ProductPicker({ artistId, onSelect, selectedProductId }: ProductPickerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [artistId, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('artist_id', artistId)
        .eq('moderation_status', 'approved');

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    const images = product.images as any;
    const imageUrl = images?.[0]?.url || images?.[0];
    
    onSelect({
      product_id: product.id,
      name: product.title,
      price: product.price || 0,
      currency: product.currency || 'USD',
      image_url: imageUrl,
      thumbnail_url: imageUrl,
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No products found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add products in the Merch section to use them in overlays
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {products.map((product) => {
          const images = product.images as any;
          const imageUrl = images?.[0]?.url || images?.[0];
          const isSelected = selectedProductId === product.id;

          return (
            <Card
              key={product.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSelect(product)}
            >
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-1">{product.title}</h4>
                <p className="text-primary font-bold text-sm mt-1">
                  {formatPrice(product.price, product.currency)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
