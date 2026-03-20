-- Auth, Pins, Tags & Admin — Database Migration
-- Run this in Supabase SQL Editor before deploying

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 20),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Add user_id and username columns to map_pins
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS username TEXT;

-- 4. Add user_id and username columns to ward_tags
ALTER TABLE ward_tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ward_tags ADD COLUMN IF NOT EXISTS username TEXT;

-- 5. Ensure ward_tags has report columns
DO $$ BEGIN
  ALTER TABLE ward_tags ADD COLUMN report_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE ward_tags ADD COLUMN reported BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 6. RLS for map_pins
ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pins"
  ON map_pins FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert pins"
  ON map_pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pins"
  ON map_pins FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS for ward_tags
ALTER TABLE ward_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tags"
  ON ward_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON ward_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON ward_tags FOR DELETE
  USING (auth.uid() = user_id);
