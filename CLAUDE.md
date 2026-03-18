# CLAUDE.md

Shephard is a smart expenses wallet PWA built with Vue 3, TypeScript, Quasar Framework, and Supabase. It enables budget management through templates, plans, and expense tracking with multi-user sharing.

## Deep-Dive Docs

Read only the file that matches the task under `agent_docs/`:

- `agent_docs/architecture.md`: repo map, domain model, routes, layouts, ownership boundaries.
- `agent_docs/implementation.md`: data flow, mutation/error patterns, permissions, Vue/Quasar rules.
- `agent_docs/testing.md`: Vitest setup, mocking conventions, coverage expectations.
- `agent_docs/tooling.md`: commands, env, Quasar/PWA/MSW/Supabase details, verification.

## Commands

```bash
npm run dev                  # PWA dev server
npm run dev:mock             # Dev server with MSW (no backend needed)
npm run type-check           # TypeScript checking
npm run test:unit:ci         # Tests (single run)
npm run lint:changed         # Lint modified files
npm run format:changed       # Format modified files
npm run build                # Production PWA build
npm run check:bundle-budgets # Validate chunk sizes
```

## Architecture

Data flows in one direction: `src/api/` → `src/queries/` → `src/composables/` → `src/pages/` / `src/components/`

- **API** (`src/api/`): Typed Supabase access. Throws errors, never returns `{data, error}`.
- **Queries** (`src/queries/`): TanStack Query hooks. Owns caching, invalidation, mutation error handling.
- **Stores** (`src/stores/`): Pinia for client-only state (auth, preferences). Never for server data.
- **Composables** (`src/composables/`): Workflow orchestration, permissions, multi-step operations.
- **Pages/Components**: Thin UI shells. Wire to composables, no business logic or error handling.

## Key Patterns

- Mutations use `toActionResult` wrapper and `createMutationErrorHandler` with keys from `src/config/error-messages.ts`.
- Multi-step writes: structured results + best-effort rollback in composables.
- Pages stay thin — behavior lives in composables (e.g., `PlanPage.vue` → `usePlanPageState.ts`).
- Reuse layout shells: `ListPageLayout`, `DetailPageLayout`, `BaseItemFormPage`.
- Detail page action visibility: `visible !== false` and `actionsVisible !== false`.
- Keep plan overview expense consumption centralized via `usePlanOverview`.
- Keep dialog imports direct unless there is a measured reason to lazy-load.

## Code Conventions

- `<script setup>`, `type` over `interface`, `import type` for type-only imports.
- Emit events instead of passing functions as props. Use Vue 3.3+ object emit syntax.
- Prefer Quasar utility classes and components over custom CSS/implementations.
- Use `q-btn` with `to` for navigation. `$q` is available in templates automatically.
- Design tokens in `src/css/theme.scss`; utility classes in `src/css/app.scss`.

## Testing

- Co-located `*.test.ts` files. Use `installQuasarPlugin()` and `createTestingPinia({ createSpy: vi.fn })`.
- Mock query hooks with `vi.mock()` returning `{ data, isPending, mutateAsync }` refs/fns.
- Check `__mocks__` folders before writing `vi.mock()`. No root `describe` block for Vue component tests.
- Cover: loading/empty states, permission branches, rollback paths, action visibility.

## Domain

- **Template**: Reusable budget blueprint with categories and amounts.
- **Plan**: Active budget instance from a template for a specific date range.
- **Expense**: Transaction linked to a plan and category.
- **Category**: Hierarchical expense types shared across templates, plans, and expenses.

## Environment

Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`. Never commit secrets.
