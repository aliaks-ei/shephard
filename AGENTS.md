# Repository Guidelines

Shephard is a smart expenses wallet PWA built with Vue 3, Quasar, TanStack Query, Pinia, and Supabase.

Keep this file compact. Read only the docs that match the task under `agent_docs/`.

## Read As Needed

- `agent_docs/architecture.md`: repo map, domain model, routes, layouts, and ownership boundaries.
- `agent_docs/implementation.md`: data flow, layer responsibilities, mutation/error patterns, permissions, and Vue/Quasar implementation rules.
- `agent_docs/testing.md`: Vitest setup, mocking conventions, test placement, and coverage expectations.
- `agent_docs/tooling.md`: commands, env, Quasar/PWA/MSW/Supabase details, and verification guidance.

## Always Applicable Rules

- Prefer existing patterns over new abstractions.
- Keep Supabase/database access in `src/api/`.
- Keep server state in `src/queries/`; use Pinia for auth, profile, preferences, and other client-only state.
- Keep workflow logic in composables and keep pages thin.
- Use `type` over `interface` when practical, `import type` for type-only imports, and `<script setup>` for Vue SFCs.
- Keep logic out of templates.
- Prefer Quasar utility classes and scoped CSS over inline styles.
- Use `q-btn` with `to` for navigation when applicable.
- Keep dialog imports direct unless there is a measured reason to lazy-load.
- Detail page action visibility should come from `visible !== false` and `actionsVisible !== false`.
- For multi-step writes, prefer structured results plus best-effort rollback where partial failure would leave inconsistent state.
- Keep plan overview expense consumption centralized via `usePlanOverview`.

## Testing And Verification

- Tests are co-located as `*.test.ts`.
- Use `installQuasarPlugin()` for component/page tests.
- Use `createTestingPinia({ createSpy: vi.fn })` for Pinia-dependent tests.
- Mock query hooks at the module boundary with `vi.mock()` and return the same reactive shape as production hooks.
- Add coverage for rollback paths, permission branches, and visibility/guard logic when behavior changes.
- Run the smallest relevant checks before finishing: `npm run type-check`, `npm run test:unit:ci`, `npm run lint`, `npm run build`.

## Environment

- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`.
- Never commit secrets.
