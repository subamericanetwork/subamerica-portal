-- Add hashtags column to subclip_library table
ALTER TABLE subclip_library 
ADD COLUMN hashtags text[] DEFAULT '{}';