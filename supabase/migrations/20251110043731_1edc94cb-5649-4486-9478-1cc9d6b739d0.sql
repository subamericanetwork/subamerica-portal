-- Add is_draft column to subclip_library table
ALTER TABLE subclip_library 
ADD COLUMN is_draft boolean DEFAULT true;

-- Add index for filtering published clips
CREATE INDEX idx_subclip_library_is_draft ON subclip_library(is_draft);