# Testing Practices

## Read This When

- You are adding or changing tests.
- You changed behavior and need to know what coverage is expected.
- You need the repo’s usual mocking style for Vue, Quasar, Pinia, and query hooks.

## Test Style

The repo is primarily unit-test driven with co-located tests.

- Test files live next to source as `*.test.ts`.
- Most tests isolate a module with direct mocks instead of mounting a full app.
- Query-layer behavior is often tested indirectly by mocking query hooks at the module boundary.

Use `test/` for shared helpers and fixtures, but match existing file-local mocking style unless the helper materially simplifies the test.

## Vitest Setup

Key setup files:

- `vitest.config.mts`
- `test/vitest/setup-file.ts`
- `test/vitest/mocks/supabase.ts`

Important defaults:

- Environment: `happy-dom`
- Shared setup stubs Supabase, `crypto`, `Worker`, and parts of Quasar
- Test-time env vars are provided for Supabase and Google auth
- Unexpected `console.warn` calls fail tests

That last rule matters: warnings are treated as failures, not harmless noise.

## Repo Conventions By Test Type

### Pure Utilities And Logic

Test the function/composable directly.

- Prefer direct assertions over mounting a component.
- Use `nextTick()` or microtask flushing only when the reactive contract requires it.

Examples:

- `src/utils/*.test.ts`
- `src/composables/useTemplateItems.test.ts`
- `src/composables/usePlanOverview.test.ts`

### Stores And Composables With Pinia

- Use `createTestingPinia({ createSpy: vi.fn })` when mounting components that depend on stores.
- Use `setActivePinia(...)` or `setupTestingPinia()` for store/composable tests that run outside a mount.

Primary references:

- `src/composables/useExpenseRegistration.test.ts`
- `src/stores/auth.test.ts`
- `test/helpers/pinia-mocks.ts`

### Components, Pages, And Layouts

- Call `installQuasarPlugin()` at file scope.
- Stub child components aggressively when the parent contract is what you are testing.
- Focus on loading, empty, permission, event, and navigation branches.

Primary references:

- `src/pages/PlanPage.test.ts`
- `src/pages/TemplatesPage.test.ts`
- `src/layouts/DetailPageLayout.test.ts`
- `src/components/plans/PlanCard.test.ts`

## Mocking Patterns To Follow

### Query Hooks

This is the dominant convention in the repo.

- Mock `src/queries/...` modules with `vi.mock()`.
- Return the same shape the production hook exposes.
- Use `ref(...)` for reactive state.
- Include fields such as `data`, `isPending`, `mutateAsync`, and any computed collections the consumer uses.

Primary references:

- `src/composables/useExpenseRegistration.test.ts`
- `src/pages/PlanPage.test.ts`
- `src/components/plans/PlanOverviewTab.test.ts`

Use a real Vue Query client only when the behavior under test depends on query-client semantics. Optional helper:

- `test/helpers/query-testing.ts`

### Router

- Mock `useRouter()` and `useRoute()` directly for most tests.
- Use `vi.importActual()` when you need to preserve real exports.

Primary references:

- `src/router/guards/auth.test.ts`
- `src/composables/useListPage.test.ts`

### Hoisted Mocks

Use `vi.hoisted()` when a spy must exist before the module under test is evaluated.

Primary references:

- `src/composables/usePlanOverview.test.ts`
- `src/composables/useTemplateItems.test.ts`

## Coverage Expectations

When behavior changes, cover the branches this repo cares about most:

- loading and empty states
- search-empty and filtered states
- ownership and permission branches
- read-only vs editable behavior
- navigation and route-derived behavior
- event emissions and parent-child wiring
- duplicate-name / validation / backend error translation
- mutation rollback or partial-failure paths
- action visibility and guard logic

If you change query keys, invalidation, or mutation `onSuccess` / `onError` behavior, consider adding direct query-layer tests. That area currently has less explicit coverage than pages/components/composables.

## Shared Helpers

Useful but optional helpers:

- `test/helpers/component-testing.ts`
- `test/helpers/query-testing.ts`
- `test/helpers/composable-mocks.ts`
- `test/helpers/api-mocks.ts`
- `test/fixtures/*`

Current repo convention still favors explicit inline mocks in each test file, especially for query hooks and route state. Match that convention unless a helper makes the test noticeably clearer.

## Good Testing Workflow

- Start with the smallest unit that can prove the behavior.
- Mock query hooks at the boundary instead of reconstructing the full app.
- Only mount a component when template wiring or slot/render behavior matters.
- Re-run the narrowest relevant test file locally first, then broader checks if needed.
