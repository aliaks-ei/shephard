# Supabase Setup

Apply the project schema to a fresh Supabase project with the CLI:

```bash
npx supabase db push
```

This repo keeps the required database state in `supabase/migrations/`:

- core tables for categories, users, templates, plans, expenses, notifications, and push subscriptions
- auth-to-`public.users` sync trigger
- sharing and budget RPC functions used by the app
- row-level security policies for authenticated access
- baseline seeded categories

After the database is pushed, deploy the edge functions from `supabase/functions/` and configure the frontend env vars plus any function secrets required for AI, currency, and push features.
