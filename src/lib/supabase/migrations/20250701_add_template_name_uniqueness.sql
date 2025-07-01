-- Migration: Add Template Name Uniqueness Constraint
-- Applied: 2025-01-17
-- Description: Adds unique constraint to prevent duplicate template names per user (case-sensitive)

-- Add unique constraint for template name per user (case-sensitive)
ALTER TABLE templates 
ADD CONSTRAINT unique_template_name_per_user 
UNIQUE (owner_id, name); 