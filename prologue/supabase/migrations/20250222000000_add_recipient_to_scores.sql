-- Add recipient column to scores table for Leadership score calculation.
-- This allows distinguishing messages to teammates (leadership) vs manager vs gossip.
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS recipient TEXT;
