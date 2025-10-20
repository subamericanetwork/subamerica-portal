-- Add production_manager to app_role enum (must be separate from other operations)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'production_manager';