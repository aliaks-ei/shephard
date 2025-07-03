-- Migration: Create Expense Templates System
-- Applied: 2025-07-03
-- Description: Creates the complete expense templates system with proper naming and sharing capabilities

-- Create expense_templates table
CREATE TABLE expense_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL CHECK (duration IN ('weekly', 'monthly', 'yearly')),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create expense_categories table
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#FF6B6B',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create template_shares table
CREATE TABLE template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES expense_templates(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit')),
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, shared_with_user_id)
);

-- Create expense_template_items table
CREATE TABLE expense_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES expense_templates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_expense_templates_owner_id ON expense_templates(owner_id);
CREATE INDEX idx_template_shares_shared_with ON template_shares(shared_with_user_id);
CREATE INDEX idx_template_shares_template_id ON template_shares(template_id);
CREATE INDEX idx_expense_template_items_template_id ON expense_template_items(template_id);
CREATE INDEX idx_expense_template_items_category_id ON expense_template_items(category_id);
CREATE INDEX idx_expense_categories_owner_id ON expense_categories(owner_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_expense_templates_updated_at BEFORE UPDATE ON expense_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_template_items_updated_at BEFORE UPDATE ON expense_template_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE expense_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_templates
CREATE POLICY "Users can view owned and shared expense templates" ON expense_templates
FOR SELECT USING (
  owner_id = auth.uid() OR 
  id IN (
    SELECT template_id FROM template_shares 
    WHERE shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can modify owned expense templates and shared templates with edit permission" ON expense_templates
FOR ALL USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT template_id FROM template_shares 
    WHERE shared_with_user_id = auth.uid() AND permission_level = 'edit'
  )
);

-- RLS Policies for expense_categories
CREATE POLICY "Users can view their expense categories and system categories" ON expense_categories
FOR SELECT USING (owner_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can modify their expense categories" ON expense_categories
FOR ALL USING (owner_id = auth.uid() AND is_system = false);

-- RLS Policies for template_shares
CREATE POLICY "Users can view their template shares" ON template_shares
FOR SELECT USING (
  shared_by_user_id = auth.uid() OR 
  shared_with_user_id = auth.uid()
);

CREATE POLICY "Owners can manage template shares" ON template_shares
FOR ALL USING (
  shared_by_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM expense_templates 
    WHERE id = template_id AND owner_id = auth.uid()
  )
);

-- RLS Policies for expense_template_items
CREATE POLICY "Users can view items from accessible expense templates" ON expense_template_items
FOR SELECT USING (
  template_id IN (
    SELECT id FROM expense_templates
    WHERE owner_id = auth.uid() OR 
    id IN (
      SELECT template_id FROM template_shares 
      WHERE shared_with_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can modify items from owned expense templates" ON expense_template_items
FOR ALL USING (
  template_id IN (
    SELECT id FROM expense_templates WHERE owner_id = auth.uid()
  )
);

-- Create database functions for template access control
CREATE OR REPLACE FUNCTION can_access_template(template_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM expense_templates 
    WHERE id = template_id AND (
      owner_id = user_id OR 
      id IN (
        SELECT template_id FROM template_shares 
        WHERE shared_with_user_id = user_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_edit_template(template_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM expense_templates 
    WHERE id = template_id AND (
      owner_id = user_id OR 
      id IN (
        SELECT template_id FROM template_shares 
        WHERE shared_with_user_id = user_id AND permission_level = 'edit'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_template_owner(template_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM expense_templates 
    WHERE id = template_id AND owner_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_template_access(template_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN can_access_template(template_id, user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint for template name per user
ALTER TABLE expense_templates 
ADD CONSTRAINT unique_expense_template_name_per_user 
UNIQUE (owner_id, name);

-- Insert default system expense categories
INSERT INTO expense_categories (owner_id, name, color, is_system) VALUES
  (NULL, 'Food & Dining', '#FF6B6B', true),
  (NULL, 'Transportation', '#4ECDC4', true),
  (NULL, 'Entertainment', '#45B7D1', true),
  (NULL, 'Utilities', '#96CEB4', true),
  (NULL, 'Healthcare', '#FFEAA7', true),
  (NULL, 'Shopping', '#DDA0DD', true); 