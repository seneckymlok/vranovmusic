-- Supabase SQL Schema for Shows Table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Create the shows table
CREATE TABLE IF NOT EXISTS shows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    time TIME,
    venue VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(3) NOT NULL,
    ticket_url TEXT,
    flyer_image TEXT,
    description TEXT,
    is_past BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);

-- Create an index on is_past for filtering
CREATE INDEX IF NOT EXISTS idx_shows_is_past ON shows(is_past);

-- Enable Row Level Security (RLS)
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read shows (public website)
CREATE POLICY "Allow public read access" ON shows
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert
-- For now, we'll allow any authenticated user (you can restrict this later)
CREATE POLICY "Allow authenticated insert" ON shows
    FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON shows
    FOR UPDATE USING (true);

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON shows
    FOR DELETE USING (true);

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on updates
CREATE TRIGGER update_shows_updated_at
    BEFORE UPDATE ON shows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for this table (for live sync)
ALTER PUBLICATION supabase_realtime ADD TABLE shows;

-- Insert some sample data (optional - delete if you want to start fresh)
INSERT INTO shows (date, time, venue, city, country, ticket_url, is_past) VALUES
    ('2026-01-24', '20:00', 'PRAHA VENUE', 'Praha', 'CZ', 'https://goout.net/sk/vranov-music+hostia/szqwcfy', false),
    ('2026-02-14', '21:00', 'FUGA', 'Bratislava', 'SK', NULL, false),
    ('2026-03-08', '20:00', 'TABAČKA', 'Košice', 'SK', NULL, false),
    ('2026-01-10', '21:00', 'FUGA', 'Bratislava', 'SK', NULL, true),
    ('2025-12-27', '20:00', 'TABAČKA', 'Košice', 'SK', NULL, true);
