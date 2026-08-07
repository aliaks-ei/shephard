# Production database baseline

`production_schema.sql` is generated from the live Postgres catalog and contains:

- public tables, columns, defaults, constraints, and indexes
- public and private functions
- triggers
- row-level-security configuration and policies
- table and function grants
- the global category reference data

Apply it only to a fresh Supabase database:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 +  -f supabase/baseline/production_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 +  -f supabase/baseline/verify_schema.sql
```

The database baseline does not contain user, plan, template, expense,
notification, or subscription records. Auth providers, secrets, Realtime
configuration, and Edge Function deployments remain environment configuration.

