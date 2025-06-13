-- Add preferences column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferences JSONB;

-- Update existing users to have an empty preferences object
UPDATE users
SET preferences = '{}'::jsonb
WHERE preferences IS NULL; 