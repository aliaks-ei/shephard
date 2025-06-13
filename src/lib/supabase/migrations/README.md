# Database Migrations

This directory contains SQL migrations for the Shephard app's Supabase database.

## Migration: Create Users Table

The `create_users_table.sql` migration creates a custom users table in the public schema that is linked to Supabase's auth.users table. This table should be created first before running any other migrations that modify the users table.

Key features:

- Creates a users table with a foreign key reference to auth.users
- Sets up Row Level Security (RLS) policies to ensure users can only access their own data
- Creates a trigger to automatically add new auth users to our custom users table

### To apply this migration:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `create_users_table.sql`
5. Run the query

## Migration: Add Preferences to Users

The `add_preferences_to_users.sql` migration adds a `preferences` JSONB column to the `users` table. This is used to store user preferences, such as dark mode settings.

If you're running the `create_users_table.sql` migration first, you don't need to run this migration as the preferences column is already included in the table creation.

### Important Note on User Tables

Supabase has two different user tables:

1. `auth.users` - The built-in authentication table managed by Supabase Auth
2. `public.users` - Our custom users table that we use for application data

The migration adds the `preferences` column to our custom `public.users` table. The application code handles the synchronization between these tables by:

1. Creating a user record in our custom table with the same ID as the auth user
2. Keeping user preferences in our custom table
3. Referencing the auth user ID to maintain the connection

### To apply this migration:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `add_preferences_to_users.sql`
5. Run the query

### Troubleshooting

If you encounter errors after running the migration:

1. Ensure your custom `users` table exists in the public schema (run `create_users_table.sql` first)
2. Check that a user record exists in the `public.users` table matching your auth user ID
3. The application code will automatically create a matching record if one doesn't exist

After applying these migrations, the app will be able to store user preferences in the database instead of relying solely on local storage.
