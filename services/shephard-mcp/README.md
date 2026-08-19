# Shephard MCP service

This is the private remote MCP connector for Shephard. It serves a stateless Streamable HTTP endpoint at `/mcp` and authenticates users through Supabase OAuth 2.1.

## One-time Supabase setup

1. Apply `supabase/migrations/20260818110353_add_mcp_authorization_boundary.sql`.
2. In **Authentication → OAuth Server**, enable the OAuth server and set the authorization path to `https://shephard.app/oauth/consent`.
3. In **Authentication → Hooks**, configure the Custom Access Token hook as `public.custom_access_token_hook`.
4. Use an asymmetric JWT signing key in **Authentication → JWT Keys**.
5. Enable dynamic client registration only if ChatGPT or Claude requires it. Every newly registered client still receives explicit user consent in Shephard.

The migration introduces the `mcp_user` database role. MCP OAuth tokens receive that role only after the user has approved the specific client in the Shephard consent screen. It can execute only the dedicated `mcp_*` functions.

## Local run

Copy `.env.example` to `.env` and fill in the Supabase URL, publishable key, and the externally reachable service URL. Node 22 or newer is required. The PWA consent screen is deployed through Netlify at `https://shephard.app`; retain that production origin in `MCP_ALLOWED_ORIGINS`.

```sh
npm run mcp:dev
```

The service starts on port `8787` by default. Local URLs can use `http://127.0.0.1:8787`; production must use HTTPS.

## Container deployment

The included Dockerfile is host-neutral. Build it from the repository root:

```sh
docker build -f services/shephard-mcp/Dockerfile -t shephard-mcp .
docker run --env-file services/shephard-mcp/.env -p 8787:8787 shephard-mcp
```

Deploy the resulting container to a service that gives it a stable HTTPS URL. Set `MCP_RESOURCE_URL` to the full public MCP endpoint (for example, `https://mcp.example.com/mcp`) and set `MCP_ALLOWED_HOSTS` to its hostname. Do not place a service-role or secret Supabase key in the service environment.

Railway automatically provides `PORT`; the service uses it when `MCP_PORT` is not set. Leave `MCP_PORT` unset in Railway.
The root `railway.toml` selects the nested Dockerfile and configures `/health` as the deployment health check. Include `healthcheck.railway.app` in `MCP_ALLOWED_HOSTS` so Railway can run that check.

## Tools

19 tools. Read tools need the `read` grant; write tools need `write`.

Read: `list_plans`, `get_plan_overview`, `get_plan_summary`, `list_expenses`,
`list_expenses_by_date_range`, `list_categories`, `list_templates`,
`get_template`, `list_plan_shares`, `list_notifications`,
`get_user_preferences`.

Write: `record_expense`, `record_expenses`, `update_expense`, `create_plan`,
`update_plan`, `add_plan_item`, `update_plan_item`, `create_template`.

No tool deletes anything. `update_plan_with_items` and
`update_template_with_items` are deliberately not exposed: both delete every
item missing from the payload, so a partial list from an assistant would
destroy plan items. Plan edits go through the narrow tools instead.

Every write tool requires an `idempotency_key`. Reusing a key replays the
stored result instead of applying the change twice; reusing a key with a
different payload is rejected.

Every tool declares an output schema with real fields. A schema without
`properties` makes ChatGPT report "Output schema recommended" at install time,
so keep `services/shephard-mcp/src/schemas.ts` in step with the `mcp_*` SQL
return columns.

## After changing the tool list

1. Apply any new migration; a tool whose RPC is missing fails at call time.
2. Redeploy this service.
3. Reconnect the connector in ChatGPT or Claude so it re-reads `tools/list`.
   Clients cache the tool list from the initial handshake.

## Verification

```sh
npm run mcp:type-check
npm run mcp:test
curl -i https://mcp.example.com/.well-known/oauth-protected-resource/mcp
curl -i -X POST https://mcp.example.com/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

The final request should return `401` with a `WWW-Authenticate` header pointing to protected-resource metadata.
