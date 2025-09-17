-- Update events and subevents tables to include image URL columns
-- This allows direct storage of image URLs in the main tables for easier queries

-- Add image columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS logo_url TEXT NULL,
ADD COLUMN IF NOT EXISTS background_image_url TEXT NULL;

-- Add image column to subevents table
ALTER TABLE subevents 
ADD COLUMN IF NOT EXISTS image_url TEXT NULL;

-- Create indexes for image URL columns
CREATE INDEX IF NOT EXISTS idx_events_logo_url ON events(logo_url) WHERE logo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_background_url ON events(background_image_url) WHERE background_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subevents_image_url ON subevents(image_url) WHERE image_url IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN events.logo_url IS 'URL to the event logo image stored in Supabase Storage';
COMMENT ON COLUMN events.background_image_url IS 'URL to the event background image stored in Supabase Storage';
COMMENT ON COLUMN subevents.image_url IS 'URL to the sub-event image stored in Supabase Storage';