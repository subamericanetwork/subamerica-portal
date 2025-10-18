-- Add long_description field to products table
ALTER TABLE public.products 
ADD COLUMN long_description text;

COMMENT ON COLUMN public.products.long_description IS 'Detailed product description shown in product detail dialog';