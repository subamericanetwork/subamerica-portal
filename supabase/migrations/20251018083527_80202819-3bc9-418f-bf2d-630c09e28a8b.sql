-- Add SKU field to products table for inventory management
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Create index for efficient SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Add comment for documentation
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique identifier for inventory management';