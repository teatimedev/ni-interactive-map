-- Social UX Overhaul: Pin-Ward Association + Reactions
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Add ward association columns to map_pins
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS ward_slug TEXT;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS lgd_slug TEXT;

-- 2. Index for fast ward-filtered queries
CREATE INDEX IF NOT EXISTS idx_map_pins_ward
  ON map_pins (lgd_slug, ward_slug)
  WHERE reported = false;

-- 3. Pin reactions table
CREATE TABLE IF NOT EXISTS pin_reactions (
  id BIGSERIAL PRIMARY KEY,
  pin_id BIGINT NOT NULL REFERENCES map_pins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pin_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pin_reactions_pin ON pin_reactions (pin_id);

-- 4. RLS policies for pin_reactions
ALTER TABLE pin_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select" ON pin_reactions
  FOR SELECT USING (true);

CREATE POLICY "reactions_insert" ON pin_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_delete" ON pin_reactions
  FOR DELETE USING (auth.uid() = user_id);
