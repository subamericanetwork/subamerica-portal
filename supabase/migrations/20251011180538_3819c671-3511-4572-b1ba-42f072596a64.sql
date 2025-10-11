-- Add text color columns to port_settings table
ALTER TABLE port_settings
ADD COLUMN h1_color text DEFAULT '#ffffff',
ADD COLUMN h2_color text DEFAULT '#ffffff',
ADD COLUMN h3_color text DEFAULT '#ffffff',
ADD COLUMN h4_color text DEFAULT '#ffffff',
ADD COLUMN text_sm_color text DEFAULT '#ffffff',
ADD COLUMN text_md_color text DEFAULT '#ffffff',
ADD COLUMN text_lg_color text DEFAULT '#ffffff';