-- Migration: Create Templates System
-- Applied: 2025-01-17
-- Description: Creates the complete templates system with sharing capabilities

-- Create templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL CHECK (duration IN ('weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create template_shares table
CREATE TABLE template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit')),
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, shared_with_user_id)
);

-- Create template_items table
CREATE TABLE template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_templates_owner_id ON templates(owner_id);
CREATE INDEX idx_template_shares_shared_with ON template_shares(shared_with_user_id);
CREATE INDEX idx_template_shares_template_id ON template_shares(template_id);
CREATE INDEX idx_template_items_template_id ON template_items(template_id);
CREATE INDEX idx_template_items_category_id ON template_items(category_id);
CREATE INDEX idx_categories_owner_id ON categories(owner_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_items_updated_at BEFORE UPDATE ON template_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view owned and shared templates" ON templates
FOR SELECT USING (
  owner_id = auth.uid() OR 
  id IN (
    SELECT template_id FROM template_shares 
    WHERE shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can modify owned templates and shared templates with edit permission" ON templates
FOR ALL USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT template_id FROM template_shares 
    WHERE shared_with_user_id = auth.uid() AND permission_level = 'edit'
  )
);

-- RLS Policies for categories
CREATE POLICY "Users can view their categories and system categories" ON categories
FOR SELECT USING (owner_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can modify their categories" ON categories
FOR ALL USING (owner_id = auth.uid() AND is_system = false);

-- RLS Policies for template_shares
CREATE POLICY "Users can view their shares" ON template_shares
FOR SELECT USING (
  shared_by_user_id = auth.uid() OR 
  shared_with_user_id = auth.uid()
);

CREATE POLICY "Owners can manage shares" ON template_shares
FOR ALL USING (
  shared_by_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM templates 
    WHERE id = template_id AND owner_id = auth.uid()
  )
);

-- RLS Policies for template_items
CREATE POLICY "Users can view items from accessible templates" ON template_items
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

CREATE POLICY "Users can modify items from owned templates" ON template_items
FOR ALL USING (
  template_id IN (
    SELECT id FROM templates WHERE owner_id = auth.uid()
  )
);

-- Insert some default system categories (owner_id will be NULL for system categories)
INSERT INTO categories (owner_id, name, color, icon, is_system) VALUES
  (NULL, 'Food & Dining', '#FF6B6B', 'eva-shopping-cart-outline', true),
  (NULL, 'Transportation', '#4ECDC4', 'eva-car-outline', true),
  (NULL, 'Entertainment', '#45B7D1', 'eva-music-outline', true),
  (NULL, 'Utilities', '#96CEB4', 'eva-flash-outline', true),
  (NULL, 'Healthcare', '#FFEAA7', 'eva-heart-outline', true),
  (NULL, 'Shopping', '#DDA0DD', 'eva-gift-outline', true); 