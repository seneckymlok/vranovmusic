-- COMPREHENSIVE RLS FIX FOR ARCHIVE SYSTEM
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- OPTION 1: Disable RLS Entirely (Simplest Solution)
-- =====================================================
-- This is the easiest fix since your admin panel is password protected

ALTER TABLE archive_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE archive_photos DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- OPTION 2: If you want to keep RLS enabled
-- =====================================================
-- Uncomment the lines below if you prefer to keep RLS enabled
-- (but only run EITHER Option 1 OR Option 2, not both)

/*
-- First, drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to folders" ON archive_folders;
DROP POLICY IF EXISTS "Allow authenticated insert to folders" ON archive_folders;
DROP POLICY IF EXISTS "Allow authenticated update to folders" ON archive_folders;
DROP POLICY IF EXISTS "Allow authenticated delete to folders" ON archive_folders;
DROP POLICY IF EXISTS "Allow all insert to folders" ON archive_folders;
DROP POLICY IF EXISTS "Allow all update to folders" ON archive_folders;
DROP POLICY IF EXISTS "Allow all delete to folders" ON archive_folders;

DROP POLICY IF EXISTS "Allow public read access to photos" ON archive_photos;
DROP POLICY IF EXISTS "Allow authenticated insert to photos" ON archive_photos;
DROP POLICY IF EXISTS "Allow authenticated update to photos" ON archive_photos;
DROP POLICY IF EXISTS "Allow authenticated delete to photos" ON archive_photos;
DROP POLICY IF EXISTS "Allow all insert to photos" ON archive_photos;
DROP POLICY IF EXISTS "Allow all update to photos" ON archive_photos;
DROP POLICY IF EXISTS "Allow all delete to photos" ON archive_photos;

-- Enable RLS
ALTER TABLE archive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_photos ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Public read folders" ON archive_folders FOR SELECT USING (true);
CREATE POLICY "Public write folders" ON archive_folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update folders" ON archive_folders FOR UPDATE USING (true);
CREATE POLICY "Public delete folders" ON archive_folders FOR DELETE USING (true);

CREATE POLICY "Public read photos" ON archive_photos FOR SELECT USING (true);
CREATE POLICY "Public write photos" ON archive_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update photos" ON archive_photos FOR UPDATE USING (true);
CREATE POLICY "Public delete photos" ON archive_photos FOR DELETE USING (true);
*/
