# Supabase Setup

The production Supabase project (`rirgsoufkldfcogfjwwy`) is the source of truth
for the database schema. This repo tracks only **incremental** migrations and
edge function source.

## Bootstrapping a new environment

To apply the schema to a fresh Supabase project, first pull a baseline snapshot
from production (see `migrations/README.md`), then push:

```bash
supabase db dump --linked --schema public --file supabase/migrations/<ts>_baseline.sql
supabase db push
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
