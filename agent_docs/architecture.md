# Architecture

## Read This When

- You need a map of the repo before changing code.
- You are deciding where new behavior should live.
- You need to understand routing, layouts, or feature ownership.

## Project Shape

`src/` is the runtime app and the main source of truth.

- `src/api/`: typed Supabase access and domain API functions.
- `src/queries/`: TanStack Query hooks, cache keys, invalidation, mutation error handling.
- `src/stores/`: client-only/auth/profile/preferences state.
- `src/composables/`: orchestration layer that turns APIs, queries, and stores into feature workflows.
- `src/components/`: feature UI plus shared primitives.
- `src/pages/`: route-level shells.
- `src/layouts/`: reusable structural shells for list/detail/auth pages.
- `src/router/`: route tree plus the global auth guard.
- `src/utils/`: pure helpers and calculations.
- `src/mocks/`: MSW-backed mock runtime used by `npm run dev:mock`.

Other important roots:

- `test/`: shared fixtures and helpers for co-located tests.
- `src-pwa/`: PWA manifest and service worker files.
- `src-capacitor/`: mobile wrapper artifacts and config, not the main source of app logic.
- `supabase/`: local backend config and edge functions.
- `scripts/`: operational support (Codex docs automation helpers).

## Domain Model

- Template: reusable budget blueprint with items, duration, currency, and sharing.
- Plan: active budget instance for a date range, usually created from a template.
- Plan item / template item: the per-category budget line items.
- Expense: transaction tied to a plan, category, and optionally a plan item.
- Category: shared reference data used across templates, plans, and expenses.
- Sharing: plans and templates can be owned or shared, with `view` or `edit` permission levels.

See `src/api/templates.ts`, `src/api/plans.ts`, `src/api/expenses.ts`, `src/api/categories.ts`, and `src/api/base.ts`.

## Runtime Shells And Routing

Routing is intentionally shallow.

- Authenticated app shell: `/` under `src/layouts/MainLayout.vue`
- Public auth shell: `/auth` under `src/layouts/AuthLayout.vue`
- Main pages: dashboard, settings, plans, templates, and detail/create screens for plans and templates
- Catch-all 404 page: `src/pages/ErrorNotFound.vue`

Key files:

- `src/router/routes.ts`
- `src/router/index.ts`
- `src/router/guards/auth.ts`

Important rule: the router waits for `authStore.ready` before deciding access. Do not add route logic that bypasses that readiness gate.

## Layout And Page Taxonomy

The repo uses standard page shells instead of bespoke page structure.

- `src/layouts/ListPageLayout.vue`: list pages such as plans/templates.
- `src/layouts/BaseItemFormPage.vue`: shared wrapper for plan/template detail and create screens.
- `src/layouts/DetailPageLayout.vue`: detail-page chrome, banners, loading state, action bars, and mobile behavior.
- `src/layouts/MainLayout.vue`: top header, drawer navigation, mobile bottom nav, and global expense dialog.

Page files stay thin. Most page behavior should live in composables, not route SFCs.

- `src/pages/PlanPage.vue` -> `src/composables/usePlanPageState.ts`
- `src/pages/TemplatePage.vue` -> `src/composables/useTemplatePageState.ts`
- `src/pages/PlansPage.vue` -> `src/composables/usePlans.ts`
- `src/pages/TemplatesPage.vue` -> `src/composables/useTemplates.ts`

## Ownership Boundaries

Follow this dependency direction:

`api -> queries -> composables/stores -> pages/components`

Rules implied by that boundary:

- API code talks to Supabase and throws meaningful errors.
- Query hooks own fetch lifecycle, cache keys, invalidation, and mutation error mapping.
- Stores hold local/session/preferences state, not server collections.
- Composables own workflows, permissions, and multi-step operations.
- Pages and most components should wire UI to composables rather than re-implement business logic.

See:

- `src/api/base.ts`
- `src/queries/query-keys.ts`
- `src/queries/plans.ts`
- `src/queries/templates.ts`
- `src/queries/expenses.ts`
- `src/composables/usePlan.ts`
- `src/composables/useTemplate.ts`
- `src/composables/usePlanPageState.ts`

## Feature Map

- Auth: `src/pages/AuthPage.vue`, `src/pages/AuthCallbackPage.vue`, `src/stores/auth.ts`
- Dashboard: `src/pages/IndexPage.vue`, `src/components/dashboard/*`
- Plans: `src/pages/PlansPage.vue`, `src/pages/PlanPage.vue`, `src/components/plans/*`
- Templates: `src/pages/TemplatesPage.vue`, `src/pages/TemplatePage.vue`, `src/components/templates/*`
- Expenses: dialog-driven flows in `src/components/expenses/*`
- Categories: shared reference/supporting UI in `src/components/categories/*`
- Settings and preferences: `src/pages/UserSettingsPage.vue`, `src/stores/preferences.ts`, `src/stores/user.ts`
- Sharing: `src/queries/sharing.ts`, `src/components/shared/ShareEntityDialog.vue`, plan/template share dialogs

## Architectural Rules Worth Preserving

- Keep plan overview expense usage centralized in `src/composables/usePlanOverview.ts`. Do not scatter duplicate expense queries across overview widgets.
- Keep detail-page editability derived from ownership and permission state, not hardcoded UI flags.
- Treat expenses as an embedded workflow within plans/dashboard unless there is a strong reason to introduce a new route.
- Prefer extending existing list/detail page patterns before inventing a new page shell.
- Treat `src-capacitor/` and generated outputs as secondary; edit runtime behavior in `src/`, `src-pwa/`, `supabase/`, or config files.
