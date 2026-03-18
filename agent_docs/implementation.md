# Implementation Practices

## Read This When

- You are changing app behavior or adding a feature.
- You need to know where to put data access, caching, or workflow code.
- You want the repo’s expected mutation, error, permission, and UI patterns.

## Core Runtime Pattern

The normal flow is:

`src/api` -> `src/queries` -> `src/composables` -> `src/pages` / `src/components`

That is not just style. It is how the app is structured today.

## Layer Responsibilities

### API Layer

Use `src/api/` for typed Supabase access and domain operations.

- Throw errors instead of returning `{ data, error }` objects.
- Translate database-specific issues into meaningful domain errors where possible.
- Keep shared entity mechanics in the API layer instead of duplicating them in queries or UI.

Primary references:

- `src/api/base.ts`
- `src/api/plans.ts`
- `src/api/templates.ts`
- `src/api/expenses.ts`
- `src/api/auth.ts`

### Query Layer

Use `src/queries/` as the canonical boundary for server state.

- Build keys from `src/queries/query-keys.ts`.
- Accept reactive inputs with `MaybeRefOrGetter` + `toValue()` when the caller is reactive.
- Gate requests with `enabled`.
- Put cache invalidation in query hooks, not in pages/components.
- Put mutation error translation in shared query helpers.

Primary references:

- `src/queries/plans.ts`
- `src/queries/templates.ts`
- `src/queries/expenses.ts`
- `src/queries/categories.ts`
- `src/queries/query-error-handler.ts`
- `src/boot/vue-query.ts`

### Stores

Keep Pinia narrow.

- Good store usage: auth session, derived user profile, preferences, privacy mode.
- Bad store usage: plan/template/expense collections that already belong in TanStack Query.

Primary references:

- `src/stores/auth.ts`
- `src/stores/user.ts`
- `src/stores/preferences.ts`

### Composables

Composables are the main workflow layer.

- Put route-driven entity loading/editing here.
- Put multi-step saves, permission logic, action arrays, and form orchestration here.
- Prefer changing page-state composables before changing page SFCs.

Primary references:

- `src/composables/usePlan.ts`
- `src/composables/useTemplate.ts`
- `src/composables/usePlanPageState.ts`
- `src/composables/useTemplatePageState.ts`
- `src/composables/useExpenseRegistration.ts`
- `src/composables/usePlanOverview.ts`
- `src/composables/useItemsManager.ts`

## Mutation And Error-Handling Rules

- Use `toActionResult()` for multi-step workflows that should return structured success/failure to the UI.
- Let queries and mutation hooks own backend error translation.
- Use `useError()` for shared error handling and reporting.
- Use `useBanner()` for local UX validation messages, not as a replacement for query error handling.
- Prefer targeted invalidation over broad invalidation.

Primary references:

- `src/queries/mutation-utils.ts`
- `src/queries/query-error-handler.ts`
- `src/composables/useError.ts`
- `src/composables/useBanner.ts`
- `src/config/error-messages.ts`

## Multi-Step Write Patterns

Preferred pattern:

- perform the workflow in a composable
- wrap each async step with `toActionResult()`
- return a structured result to the page
- use best-effort rollback when partial writes would leave user-visible inconsistencies

Current examples:

- Plan create/update orchestration: `src/composables/usePlan.ts`
- Template create/update orchestration: `src/composables/useTemplate.ts`
- Expense create/delete rollback logic: `src/composables/useExpenseRegistration.ts`

Important current nuance:

- Plan item updates are diff-based and try to preserve existing item IDs.
- Template item updates are replace-all and do not preserve item IDs across edits.

Do not assume template item IDs are stable after edits.

## Permissions And Sharing

- Ownership and `permission_level` determine editability.
- Shared/owned entity merging happens in the API layer.
- New shareable entities should follow the generic sharing patterns instead of cloning bespoke logic.

Primary references:

- `src/api/base.ts`
- `src/composables/usePlan.ts`
- `src/composables/useTemplate.ts`
- `src/queries/sharing.ts`

## UI And Page Rules

- Keep page SFCs thin and declarative.
- Keep business logic out of templates.
- Use `<script setup>` everywhere.
- Prefer `type` over `interface` when practical.
- Use `import type` for type-only imports.
- Use Vue 3 object emit syntax.
- Prefer Quasar utility classes and scoped CSS over inline styles.
- Use `q-btn` with `to` for navigation when applicable.
- Keep dialog imports direct by default. Only lazy-load if there is a measured reason.

Detail-page-specific rules:

- Build action arrays in composables.
- Visibility should come from `visible !== false` and `actionsVisible !== false`.
- Read-only behavior should come from permission-derived state, not one-off page flags.

Primary references:

- `src/pages/PlanPage.vue`
- `src/pages/TemplatePage.vue`
- `src/components/shared/ActionBar.vue`
- `src/components/shared/DetailMobileActionBar.vue`
- `src/layouts/BaseItemFormPage.vue`
- `src/layouts/DetailPageLayout.vue`

## Existing Exceptions

The current codebase has a few intentional or tolerated exceptions. Do not “normalize” them without understanding the reason.

- `usePlanPageState()` fetches template details directly for template selection instead of introducing a dedicated one-off query hook.
- Some dialogs are direct imports by design because the repo prefers predictable UX and simpler loading behavior over speculative lazy loading.
- Expenses currently show the strongest rollback behavior; plan/template flows are more fail-fast.

## What Good Changes Usually Look Like

- New database or RPC work starts in `src/api/`.
- New server-state behavior is surfaced through a query hook.
- New page behavior is expressed in a feature composable.
- UI changes preserve the existing list/detail page shells.
- Error handling reuses the shared error-message and mutation-error infrastructure.
- Tests cover loading, permission, rollback, and visibility branches when behavior changes.
