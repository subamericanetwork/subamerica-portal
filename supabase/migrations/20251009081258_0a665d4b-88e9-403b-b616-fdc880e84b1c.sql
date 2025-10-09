-- Add description and link fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '';

-- Update existing null links to empty string
UPDATE products SET link = '' WHERE link IS NULL;

-- Now make link required for new products
ALTER TABLE products
ALTER COLUMN link SET NOT NULL;