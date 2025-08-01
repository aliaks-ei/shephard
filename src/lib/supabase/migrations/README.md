# Database Migrations

This directory contains SQL migrations for the Shephard app's Supabase database.

## Migration: Create Users Table

The `create_users_table.sql` migration creates a custom users table in the public schema that is linked to Supabase's auth.users table. This table should be created first before running any other migrations.

Key features:

- Creates a users table with a foreign key reference to auth.users
- Sets up Row Level Security (RLS) policies to ensure users can only access their own data
- Creates a trigger to automatically add new auth users to our custom users table
- Includes a preferences JSONB column for storing user preferences

### To apply this migration:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `create_users_table.sql`
5. Run the query

## Migration: Create Expense Templates System

The `20250703_create_expense_templates_system.sql` migration creates the complete expense templates system with proper naming conventions.

Key features:

- Creates `expense_templates` table with total and currency fields
- Creates `expense_categories` table for categorizing expenses
- Creates `expense_template_items` table with name field for individual template items
- Creates `template_shares` table for sharing templates between users
- Sets up comprehensive Row Level Security (RLS) policies
- Creates database functions for template access control
- Includes performance indexes and triggers
- Inserts default system expense categories

### Database Schema:

- **expense_templates**: Main templates with owner, name, duration, total, currency
- **expense_categories**: Categories for organizing expenses (user-created and system)
- **expense_template_items**: Individual items within templates with name and amount
- **template_shares**: Sharing permissions between users

### To apply this migration:

1. Ensure the users table migration has been applied first
2. Open your Supabase project dashboard
3. Navigate to the SQL Editor
4. Create a new query
5. Copy and paste the contents of `20250703_create_expense_templates_system.sql`
6. Run the query

### Important Notes

- The expense templates system uses semantic naming for better clarity
- System categories are created automatically and shared across all users
- RLS policies ensure users can only access their own templates or templates shared with them
- Database functions provide secure access control for template operations
- Template names must be unique per user

### Troubleshooting

If you encounter errors:

1. Ensure the users table exists first
2. Check that auth.users table is accessible
3. Verify that the auth schema and functions are properly set up in your Supabase project
4. Make sure you have the necessary permissions to create tables and functions

After applying these migrations, the app will have a complete expense templates system with proper security and sharing capabilities.
