-- Migration: Add name field to template_categories
-- Applied: 2025-07-01
-- Description: Adds a name field to template_categories to allow multiple items per category

-- Add name column to template_categories table
ALTER TABLE template_categories ADD COLUMN name TEXT NOT NULL DEFAULT '';

-- Update the column to remove the default constraint after adding it
-- (This allows existing records to have empty names initially)
ALTER TABLE template_categories ALTER COLUMN name DROP DEFAULT; 