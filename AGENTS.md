# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the app code:
  - `api/` for data access
  - `queries/` for TanStack Query hooks
  - `stores/` for client-only state
  - `components/`, `pages/`, `layouts/`, `composables/`, `utils/`, `router/`
- Tests are co-located with implementation files as `*.test.ts`.
- `public/` contains static assets; `src/assets/` contains bundled assets.
- `src-pwa/` contains PWA config.
- `src-capacitor/` contains mobile wrapper config.
- `supabase/` contains backend config and edge functions.

## Build, Test, and Development Commands

- `npm run dev`: run Quasar PWA dev server.
- `npm run dev:mock`: run dev server with MSW enabled.
- `npm run build`: production PWA build.
- `npm run build:analyze`: build with bundle analysis.
- `npm run preview`: build + serve locally on port 4173.
- `npm run lint` / `npm run format`: lint and format the repo.
- `npm run type-check`: TypeScript check with `vue-tsc`.
- `npm run test:unit` / `npm run test:unit:ci`: unit tests in watch / CI mode.
- `npm run check:bundle-budgets`: enforce bundle guardrails.

## Coding Style & Naming Conventions

- Vue 3 Composition API with `<script setup>`.
- Use `type` over `interface` when possible; avoid enums.
- Use `import type` for type-only imports.
- Keep logic in composables/services, not templates.
- Use Vue 3.3+ object emit syntax: `defineEmits<{ 'event-name': [payload: Type] }>()`.
- Prefer Quasar utility classes (`q-pa-*`, `q-ma-*`, etc.) and scoped CSS classes over inline `style` attributes.
- Avoid obvious/non-informative comments.

## Architecture & Error Handling

- Four-layer pattern:
  - `src/api/`: throws typed/meaningful errors
  - `src/queries/`: owns fetching/caching/mutations
  - `src/stores/`: client-only state
  - UI: render + user interactions only
- Keep expense data subscriptions centralized per page context to avoid duplicate query usage (for plan overview, consume expense data via `usePlanOverview`).
- For multi-step writes (for example expense creation + completion updates), use best-effort rollback to reduce partial updates.
- Mutations should use shared query error handlers; components should not own mutation error translation.

## Quasar/UI Practices

- Use `q-btn` with `to` for navigation when applicable.
- Prefer classes/utilities instead of inline styles for spacing/sizing/positioning.
- Keep dialog imports direct by default; do not lazy-load dialogs unless there is a measured, compelling performance reason.
- Detail page action visibility should come from action state (`visible !== false`) and explicit visibility flags (`actionsVisible !== false`).

## Testing Guidelines

- Frameworks: Vitest + `@vue/test-utils`.
- Use `installQuasarPlugin()` for component tests.
- Use `createTestingPinia({ createSpy: vi.fn })` for Pinia-dependent tests.
- Mock query hooks with `vi.mock()` and return refs/fns (`data`, `isPending`, `mutateAsync`).
- Add coverage for mutation rollback paths and visibility/guard logic when behavior changes.

## Commit & Pull Request Guidelines

- Use concise commit subjects; conventional commit format is preferred.
- PRs should include summary, testing notes, and visual proof for UI changes.

## Environment & Configuration

- Create `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`.
- Never commit secrets.
