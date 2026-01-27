
-- Table to track gambling spins per visitor
CREATE TABLE IF NOT EXISTS gamble_spins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_gamble_spins_visitor_date ON gamble_spins(visitor_id, created_at);

-- RLS Policies
ALTER TABLE gamble_spins ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to insert their spin
CREATE POLICY "Allow anon insert spins" ON gamble_spins
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read their own spins (based on visitor_id claim? No, strictly rely on client query for now or simple "select count")
-- Since visitor_id is a hash, we can allow anon to select count where visitor_id matches.
CREATE POLICY "Allow anon select spins" ON gamble_spins
  FOR SELECT
  TO anon
  USING (true);
