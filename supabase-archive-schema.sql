-- Supabase SQL Schema for Archive Tables
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- =====================================================
-- ARCHIVE FOLDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS archive_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('photos', 'videos', 'flyers')),
    event_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_archive_folders_category ON archive_folders(category);
CREATE INDEX IF NOT EXISTS idx_archive_folders_event_date ON archive_folders(event_date);

-- =====================================================
-- ARCHIVE PHOTOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS archive_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID NOT NULL REFERENCES archive_folders(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    photo_date DATE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_archive_photos_folder_id ON archive_photos(folder_id);
CREATE INDEX IF NOT EXISTS idx_archive_photos_display_order ON archive_photos(display_order);
CREATE INDEX IF NOT EXISTS idx_archive_photos_photo_date ON archive_photos(photo_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE archive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for folders
CREATE POLICY "Allow public read access to folders" ON archive_folders
    FOR SELECT USING (true);

-- Public read access for photos
CREATE POLICY "Allow public read access to photos" ON archive_photos
    FOR SELECT USING (true);

-- Authenticated users can insert folders
CREATE POLICY "Allow authenticated insert to folders" ON archive_folders
    FOR INSERT WITH CHECK (true);

-- Authenticated users can update folders
CREATE POLICY "Allow authenticated update to folders" ON archive_folders
    FOR UPDATE USING (true);

-- Authenticated users can delete folders
CREATE POLICY "Allow authenticated delete to folders" ON archive_folders
    FOR DELETE USING (true);

-- Authenticated users can insert photos
CREATE POLICY "Allow authenticated insert to photos" ON archive_photos
    FOR INSERT WITH CHECK (true);

-- Authenticated users can update photos
CREATE POLICY "Allow authenticated update to photos" ON archive_photos
    FOR UPDATE USING (true);

-- Authenticated users can delete photos
CREATE POLICY "Allow authenticated delete to photos" ON archive_photos
    FOR DELETE USING (true);

-- =====================================================
-- FUNCTION FOR UPDATING TIMESTAMPS
-- =====================================================

-- Function to automatically update 'updated_at' timestamp
-- (Only create if it doesn't exist - it may have been created by shows schema)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for archive_folders
CREATE TRIGGER update_archive_folders_updated_at
    BEFORE UPDATE ON archive_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for archive_photos
CREATE TRIGGER update_archive_photos_updated_at
    BEFORE UPDATE ON archive_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for archive tables
ALTER PUBLICATION supabase_realtime ADD TABLE archive_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE archive_photos;

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================
-- Note: Run these commands in the Supabase Dashboard > Storage
-- Or via SQL if you have the necessary permissions:

-- Create storage bucket for archive photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('archive-photos', 'archive-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for archive-photos bucket
-- Allow public read access
CREATE POLICY "Public read access for archive photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'archive-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload archive photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'archive-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update archive photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'archive-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete archive photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'archive-photos' AND auth.role() = 'authenticated');

-- =====================================================
-- SAMPLE DATA (OPTIONAL - DELETE IF NOT NEEDED)
-- =====================================================

-- Insert sample folder
-- INSERT INTO archive_folders (name, description, category, event_date) VALUES
--     ('Summer Tour 2025', 'Photos from our summer tour across Europe', 'photos', '2025-07-15'),
--     ('Event Flyers', 'Collection of event promotional materials', 'flyers', NULL);

-- Insert sample photos (after creating folders)
-- INSERT INTO archive_photos (folder_id, title, description, photo_date, url, thumbnail_url, display_order) VALUES
--     ('folder-id-here', 'Backstage Prague', 'Behind the scenes at Praha Venue', '2025-07-15', '/path/to/photo.jpg', '/path/to/thumb.jpg', 1);
