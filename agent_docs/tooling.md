# Tooling And Operations

## Read This When

- You need the correct commands for development, testing, or builds.
- You are touching Quasar, PWA, MSW, Capacitor, or Supabase code.
- You need to know what environment variables and verification steps matter.

## Core Commands

Source of truth: `package.json`

- `npm run dev`: Quasar PWA dev server
- `npm run dev:mock`: dev server with MSW enabled
- `npm run build`: production PWA build
- `npm run build:analyze`: production build with bundle analysis
- `npm run build:production`: explicit production build
- `npm run preview`: build and serve locally on port `4173`
- `npm run lint`: ESLint over app files
- `npm run format`: Prettier over repo files
- `npm run type-check`: `vue-tsc --noEmit`
- `npm run test:unit`: Vitest watch mode
- `npm run test:unit:ci`: single-run Vitest
- `npm run test:edge`: Deno tests for Edge Function helpers
- `npm run mcp:dev`: run the dedicated MCP service
- `npm run mcp:type-check`, `npm run mcp:test`, `npm run mcp:build`: validate the MCP service

Changed-file helpers also exist:

- `npm run lint:changed`
- `npm run format:changed`

Operational nuance:

- `npm run dev` explicitly runs Quasar in PWA mode.
- `npm run dev:mock` enables MSW but does not exactly mirror the normal PWA dev command, so do not assume mock mode is a perfect proxy for the production PWA shell.
- `postinstall` runs `quasar prepare`.
- `prepare` installs Husky.

## Verification Guidance

Run the smallest relevant checks for the change.

- UI or state changes: `npm run test:unit:ci`
- Type-level or composable changes: `npm run type-check`
- Broad app behavior changes: `npm run lint` and `npm run test:unit:ci`
- Build/config/perf changes: `npm run build`
- Edge Function changes: `npm run test:edge`, then deploy and verify the live function version

## Environment

Required frontend env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID`

See:

- `.env.example`
- `README.md`
- `src/lib/supabase/client.ts`

The Supabase client throws early if required env vars are missing.

## Quasar And Build Configuration

Source of truth: `quasar.config.ts`

Important behavior already configured there:

- Boot order: dev-only `mocks`, then `vue-query`, `auth`, `addressbar-color`
- Router mode: history
- Strict TypeScript via Quasar build config
- Production chunk splitting for Vue, Query, Supabase, and VueUse
- Compression plugin for production builds
- Checker plugin for TypeScript and ESLint in dev
- PWA runtime caching rules for Supabase API/auth, static assets, fonts, and images
- Capacitor support enabled
- Node 22 is the minimum local/CI runtime.
- HEIC source images are excluded from the Workbox precache; conversion remains runtime-only.

Treat `quasar.config.ts` as the place to change app-level runtime/build behavior, not individual feature files.

## Linting And Formatting

Primary references:

- `eslint.config.js`
- `.prettierrc.json`
- `.husky/pre-commit`

Important rules already encoded in tooling:

- `supabase/functions/**` is excluded from frontend ESLint
- `supabase/functions/**` is also excluded from the root TypeScript config
- Type-only imports are enforced
- unused vars are enforced
- accessibility rules apply to Vue files
- `console.warn` is disallowed in tests because warnings fail the shared Vitest setup

Prefer fixing formatting and linting with the configured tools instead of adding more prose rules to docs.

Important limitation:

- Root `npm run lint` and `npm run type-check` do not validate Deno edge functions under `supabase/functions/`. Use `npm run test:edge` for the existing Deno suite and deploy validation for function entrypoints.

Pre-commit behavior is intentionally light:

- the Husky pre-commit hook runs `npx lint-staged`
- `lint-staged` formats matching files with Prettier
- it does not run lint, tests, or type-checking

## Mock Runtime

MSW support exists for local development.

- `npm run dev:mock` enables mock mode
- `src/boot/mocks.ts` loads `src/mocks/enable.ts`
- `src/mocks/enable.ts` seeds auth and starts the worker only when `VITE_MSW_ENABLED=true`

Mock data and handlers live in:

- `src/mocks/data/*`
- `src/mocks/handlers/*`

Use mock mode for isolated UI work when backend dependency would slow iteration.

Remember that mock mode is both dev-only and env-gated.

## Supabase And Edge Functions

Frontend access:

- `src/lib/supabase/client.ts`
- `src/lib/supabase/types.ts`

Backend-local config:

- `supabase/config.toml`

Local database workflow:

- This machine uses Colima. Start it with `colima start` before any local Supabase command.
- Colima's Docker runtime also requires the Docker CLI to be installed and available on `PATH`.
- For managed schema changes in the production `shephard` project (`rirgsoufkldfcogfjwwy`), use the connected Supabase MCP, then verify migration history and advisors.

Edge functions currently cover:

- expense photo analysis
- expense categorization
- currency conversion
- notification event emission
- web push subscription management

Primary references:

- `supabase/functions/analyze-expense-photo/index.ts`
- `supabase/functions/categorize-expense/index.ts`
- `supabase/functions/convert-currency/index.ts`
- `supabase/functions/emit-notification-event/index.ts`
- `supabase/functions/push-subscriptions/index.ts`
- `supabase/functions/_shared/ai-utils.ts`

Important nuance:

- Edge functions run in Deno and are operationally separate from the frontend build/lint setup.
- Frontend docs and tests should not assume ESLint coverage or Node runtime conventions apply there.
- `supabase/config.toml` does not currently enumerate every function directory in the repo, so review it when adding or changing edge functions.
- Each function pins its import-map dependencies; do not replace exact versions with floating major ranges.
- `emit-notification-event` claims durable outbox rows and schedules web-push delivery with `EdgeRuntime.waitUntil`.

## PWA And Mobile Wrapper

PWA-specific files:

- `src-pwa/manifest.json`
- `src-pwa/custom-service-worker.ts`
- `src-pwa/register-service-worker.ts`

Important PWA nuance:

- The app currently uses `InjectManifest` in `quasar.config.ts`.
- `src-pwa/custom-service-worker.ts` is the shipping service worker; edits there affect production PWA behavior.
- `extendInjectManifestOptions` in `quasar.config.ts` is the extension point for tuning precache globs and other InjectManifest options.
- Manifest behavior is split between `src-pwa/manifest.json` and runtime overrides in `quasar.config.ts`; check both when changing installability metadata.

Mobile wrapper:

- `src-capacitor/`

Treat `src/` as the main app source. Use `src-pwa/` and `src-capacitor/` when the task is explicitly about installability, offline behavior, native wrapper behavior, or deployment packaging.

For Capacitor:

- treat `src-capacitor/www` as generated output, not source of truth
- treat root app code in `src/` as the source of truth for runtime behavior
- assume iOS is the clearest maintained target unless you confirm Android-specific wiring locally

## Codex Docs Automation

The repo now includes Codex-driven docs workflows under `.github/workflows/`.

- `codex-doc-review.yml`: runs on same-repo pull requests in read-only mode and comments when durable docs may be stale.
- `codex-doc-update.yml`: runs only when a maintainer triggers it with `workflow_dispatch` or an `@codex update docs` pull request comment.

Important behavior:

- Codex review/update prompts live in `.github/codex/prompts/`.
- The write-capable workflow is restricted to `AGENTS.md`, `README.md`, and `agent_docs/*.md`.
- Both workflows require the `OPENAI_API_KEY` repository secret.
- Forked pull requests are intentionally limited to review-only/manual follow-up patterns because automatic pushes back to fork branches are not supported by this setup.

## Deployment

Primary reference:

- `netlify.toml`

Important deployment behavior:

- published output is `dist/pwa`
- production PWA domain is `https://shephard.app`
- OAuth consent for the MCP authorization server is served by the PWA at `https://shephard.app/oauth/consent`
- SPA routing is handled with a redirect to `/index.html`
- CSP and cache headers are tightly coupled to the current Supabase + Google Sign-In setup

If you change auth providers, external scripts, remote assets, or PWA asset paths, review `netlify.toml` along with the app code.
