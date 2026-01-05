# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the app code: `api/` (data fetchers), `stores/` (Pinia state), `components/`, `pages/`, `layouts/`, `composables/`, `utils/`, and `router/`.
- Tests are co-located with source files using the `.test.ts` suffix (for example, `src/pages/PlansPage.test.ts`).
- `public/` holds static assets; `src/assets/` for bundled assets.
- `src-pwa/` contains PWA configuration (manifest and service worker); `src-capacitor/` for mobile wrapper.
- `supabase/` includes backend config and edge functions; `dist/` is the production build output.

## Build, Test, and Development Commands

- `npm run dev`: run the Quasar PWA dev server with hot reload.
- `npm run build`: create a production PWA build in `dist/`.
- `npm run preview`: build and serve the PWA locally on port 4173.
- `npm run lint` / `npm run format`: run ESLint and Prettier across the repo.
- `npm run type-check`: TypeScript type checking via `vue-tsc`.
- `npm run test:unit` / `npm run test:unit:ci`: Vitest watch mode or single-run (CI).

## Coding Style & Naming Conventions

- Vue 3 Composition API with `<script setup>` only; keep logic out of templates.
- Use types over interfaces, avoid enums, prefer `unknown` with type guards.
- Use `import type` for type-only imports and Supabase-generated types where possible.
- Formatting is enforced by ESLint + Prettier; default to 2-space indentation.
- Prefer Quasar utilities (`q-pa-*`, `q-ma-*`) and `q-btn` with `to` for navigation.

## Architecture & Error Handling

- Three-layer pattern: `src/api/` (throws errors), `src/stores/` (handles errors and business logic), UI components (render only).
- Stores handle errors via `useError().handleError()` with keys from `src/config/error-messages.ts`; components do not implement error handling.

## Testing Guidelines

- Frameworks: Vitest + `@vue/test-utils`; tests live next to sources as `.test.ts`.
- Use `installQuasarPlugin()` for component tests and `createTestingPinia({ createSpy: vi.fn })` for store tests.
- For Vue components, avoid a root `describe` block and check `__mocks__` before `vi.mock()`.

## Commit & Pull Request Guidelines

- Commit subjects are short and descriptive; optional issue/PR references in parentheses (for example, `UI cleanup (#67)`).
- PRs should include a concise summary, testing notes, and screenshots or clips for UI changes when applicable.

## Environment & Configuration

- Create a `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GOOGLE_CLIENT_ID`; do not commit secrets.
