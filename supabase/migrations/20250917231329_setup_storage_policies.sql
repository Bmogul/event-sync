-- Create storage bucket and policies for event images
-- This sets up the storage structure and access policies

-- Create the event-assets bucket if it doesn't exist
-- Note: This needs to be done through the Supabase Dashboard or using the storage API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-assets', 'event-assets', true);

-- Create storage policies for the event-assets bucket
-- Policy: Allow authenticated users to view all files
CREATE POLICY "Allow authenticated users to view event assets" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'event-assets' AND auth.role() = 'authenticated'
    );

-- Policy: Allow authenticated users to upload files to their event folders
CREATE POLICY "Allow users to upload to their event folders" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'event-assets' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'logos' OR
        (storage.foldername(name))[1] = 'sub-events' OR
        (storage.foldername(name))[1] = 'backgrounds'
    );

-- Policy: Allow users to update files they uploaded
CREATE POLICY "Allow users to update their uploaded files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'event-assets' AND 
        auth.role() = 'authenticated' AND
        owner = auth.uid()
    );

-- Policy: Allow users to delete files they uploaded
CREATE POLICY "Allow users to delete their uploaded files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'event-assets' AND 
        auth.role() = 'authenticated' AND
        owner = auth.uid()
    );

-- Note: The bucket needs to be created manually in the Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "Create bucket"
-- 3. Name it "event-assets"
-- 4. Set it as Public bucket
-- 5. Create the following folders: logos, sub-events, backgrounds