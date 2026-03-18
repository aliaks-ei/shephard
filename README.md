# Shephard

Smart expenses wallet built with Vue 3, Quasar, and Supabase.

## Features

- Plans and templates for recurring budgeting periods
- Fast expense registration in two modes: quick-select (from plan items) and custom-entry
- Budget overview by category with remaining budget tracking
- Shared plans/templates with view or edit permissions
- Multi-currency support (`EUR`, `USD`, `GBP`)
- Progressive Web App support (installable, offline-ready, mobile-first)

## Tech Stack

- Vue 3 (`<script setup>`) + TypeScript
- Quasar Framework (PWA mode)
- TanStack Query for server state
- Pinia for client-side state only
- Supabase (Auth + Postgres + RLS)
- Vitest + Vue Test Utils for unit tests

## Architecture

The app follows a four-layer structure:

- `src/api/`: raw data access and domain API calls (throws errors)
- `src/queries/`: TanStack Query hooks for fetching, caching, invalidation, and mutations
- `src/stores/`: local client state (auth/user/preferences/notifications)
- UI (`components/pages/layouts`): rendering and interaction only

Error handling conventions:

- Query mutations use shared query error handlers
- Stores use centralized app error helpers
- Components do not implement direct API error handling logic

## Recent Changes

- Mobile detail pages now use a dedicated action bar with smarter overflow behavior
- Detail action visibility is derived from visible actions instead of hardcoded flags
- Expense registration and plan-item completion flows now include best-effort rollback to reduce partial updates
- Plan overview now owns expense query consumption to avoid duplicate query subscriptions
- Shared date input helpers (`formatDateInput`, `parseDateInput`) were added for consistency
- Expense dialogs on core screens are directly imported (no lazy dialog loading)

## Prerequisites

- Node.js: `^18 || ^20 || ^22 || ^24 || ^26 || ^28`
- npm `>= 6.13.4` (or Yarn `>= 1.21.1`)
- Supabase project

## Environment

Create `.env` in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Install

```bash
npm install
# or
yarn
```

## Development Commands

```bash
npm run dev          # Quasar PWA dev server
npm run dev:mock     # Dev server with MSW enabled
npm run lint
npm run format
npm run type-check
npm run test:unit    # Watch mode
npm run test:unit:ci # Single run
```

## Build Commands

```bash
npm run build
npm run build:analyze
npm run build:production
npm run preview
npm run check:bundle-budgets
```

## CI And Docs Automation

- `.github/workflows/ci.yml` runs lint, type-check, unit tests, and a production build on `main`, `dev`, and matching pull requests.
- `.github/workflows/codex-doc-review.yml` runs Codex in read-only mode on same-repo pull requests and comments when `AGENTS.md`, `agent_docs/*.md`, or `README.md` look stale.
- `.github/workflows/codex-doc-update.yml` is maintainer-triggered. It can update only `AGENTS.md`, `agent_docs/*.md`, and `README.md`, then push the doc commit back to the pull request branch.
- Codex workflows require a repository secret named `OPENAI_API_KEY`.

## Testing

- Tests are co-located with sources as `*.test.ts`
- Use `installQuasarPlugin()` for component tests
- Use `createTestingPinia({ createSpy: vi.fn })` for store/composable tests involving Pinia

## PWA Configuration

- `src-pwa/manifest.json`
- `src-pwa/register-service-worker.ts`

## License

[MIT](LICENSE)
