-- Create event_images table for tracking image metadata and relationships
-- This table stores metadata about all images uploaded for events

CREATE TABLE IF NOT EXISTS event_images (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('logo', 'sub-event', 'background')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    public_url TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL,
    subevent_id INTEGER NULL, -- For sub-event images
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_type ON event_images(image_type);
CREATE INDEX IF NOT EXISTS idx_event_images_subevent ON event_images(subevent_id);
CREATE INDEX IF NOT EXISTS idx_event_images_uploaded_by ON event_images(uploaded_by);

-- Add foreign key constraints (assuming your existing tables)
-- Note: Adjust table names if they differ in your schema
ALTER TABLE event_images 
ADD CONSTRAINT fk_event_images_event_id 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_images 
ADD CONSTRAINT fk_event_images_uploaded_by 
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

-- Add constraint for subevent_id (only for sub-event images)
ALTER TABLE event_images 
ADD CONSTRAINT fk_event_images_subevent_id 
FOREIGN KEY (subevent_id) REFERENCES subevents(id) ON DELETE CASCADE;

-- Add constraint to ensure subevent_id is only set for sub-event images
ALTER TABLE event_images 
ADD CONSTRAINT chk_subevent_id_consistency 
CHECK (
    (image_type = 'sub-event' AND subevent_id IS NOT NULL) OR
    (image_type != 'sub-event' AND subevent_id IS NULL)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_images_updated_at
    BEFORE UPDATE ON event_images
    FOR EACH ROW
    EXECUTE FUNCTION update_event_images_updated_at();