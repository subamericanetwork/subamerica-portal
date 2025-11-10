-- Update subclip_library table qr_type constraint to include 'none'
ALTER TABLE subclip_library 
  DROP CONSTRAINT IF EXISTS subclip_library_qr_type_check;

ALTER TABLE subclip_library 
  ADD CONSTRAINT subclip_library_qr_type_check 
  CHECK (qr_type IN ('none','tip','ticket','content','merch'));

-- Update social_scheduled_posts table qr_type constraint to include 'none'
ALTER TABLE social_scheduled_posts 
  DROP CONSTRAINT IF EXISTS social_scheduled_posts_qr_type_check;

ALTER TABLE social_scheduled_posts 
  ADD CONSTRAINT social_scheduled_posts_qr_type_check 
  CHECK (qr_type IN ('none','tip','ticket','content','merch'));