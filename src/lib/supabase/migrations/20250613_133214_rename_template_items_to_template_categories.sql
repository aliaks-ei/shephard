-- Migration: Rename template_items to template_categories
-- Applied: 2025-01-17
-- Description: Renames template_items table to template_categories for better semantic clarity

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_template_items_updated_at ON template_items;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_template_items_template_id;
DROP INDEX IF EXISTS idx_template_items_category_id;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view items from accessible templates" ON template_items;
DROP POLICY IF EXISTS "Users can modify items from owned templates" ON template_items;

-- Rename the table
ALTER TABLE template_items RENAME TO template_categories;

-- Recreate indexes with new names
CREATE INDEX idx_template_categories_template_id ON template_categories(template_id);
CREATE INDEX idx_template_categories_category_id ON template_categories(category_id);

-- Recreate trigger with new name
CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON template_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate RLS policies with new names
CREATE POLICY "Users can view categories from accessible templates" ON template_categories
FOR SELECT USING (
  template_id IN (
    SELECT id FROM templates
    WHERE owner_id = auth.uid() OR 
    id IN (
      SELECT template_id FROM template_shares 
      WHERE shared_with_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can modify categories from owned templates" ON template_categories
FOR ALL USING (
  template_id IN (
    SELECT id FROM templates WHERE owner_id = auth.uid()
  )
); 