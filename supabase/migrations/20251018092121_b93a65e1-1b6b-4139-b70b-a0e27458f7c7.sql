-- Create table to track Printify-specific product data
CREATE TABLE IF NOT EXISTS public.printify_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  printify_product_id TEXT NOT NULL,
  printify_blueprint_id TEXT,
  print_provider_id INTEGER,
  shop_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.printify_products ENABLE ROW LEVEL SECURITY;

-- Artists can view their own Printify products
CREATE POLICY "Artists can view their own Printify products"
ON public.printify_products
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM public.products WHERE is_artist_owner(artist_id)
  )
);

-- Artists can insert their own Printify products
CREATE POLICY "Artists can insert their own Printify products"
ON public.printify_products
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM public.products WHERE is_artist_owner(artist_id)
  )
);

-- Artists can update their own Printify products
CREATE POLICY "Artists can update their own Printify products"
ON public.printify_products
FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM public.products WHERE is_artist_owner(artist_id)
  )
);

-- Artists can delete their own Printify products
CREATE POLICY "Artists can delete their own Printify products"
ON public.printify_products
FOR DELETE
USING (
  product_id IN (
    SELECT id FROM public.products WHERE is_artist_owner(artist_id)
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_printify_products_updated_at
BEFORE UPDATE ON public.printify_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();