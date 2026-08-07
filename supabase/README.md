# Supabase Setup

The production Supabase project (`rirgsoufkldfcogfjwwy`) is the source of truth
for the database schema. This repo tracks a production baseline, the remote
migration ledger, subsequent migrations, and Edge Function source.

## Bootstrapping a new environment

To apply the schema to a fresh Supabase project, apply the committed baseline,
verify it, and then apply migrations newer than the baseline snapshot:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/baseline/production_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/baseline/verify_schema.sql
```

## Edge functions

After the database is in place, deploy the edge functions from
`supabase/functions/` and configure the frontend env vars plus function secrets
(OpenAI, ExchangeRate-API, VAPID, etc.).

```bash
supabase functions deploy
```

## Adding schema changes

Create a new timestamped migration in `supabase/migrations/` and either push via
`supabase db push` or apply through the Supabase MCP `apply_migration` tool.
Keep the filename's timestamp in sync with what lands in the remote
`supabase_migrations.schema_migrations` table.
