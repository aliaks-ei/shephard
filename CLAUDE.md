# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shephard is a smart expenses wallet PWA built with Vue 3, TypeScript, Quasar Framework, and Supabase. It enables budget management through templates, plans, and expense tracking with multi-user sharing capabilities.

## Development Commands

```bash
# Development
npm run dev                 # Start PWA dev server with hot reload

# Quality checks (run before commits)
npm run lint:changed        # Lint modified files
npm run format:changed      # Format modified files
npm run type-check          # TypeScript type checking

# Testing
npm run test:unit           # Run tests in watch mode
npm run test:unit:ci        # Run tests once (CI mode)

# Build
npm run build               # Production PWA build
```

## Architecture

### Data Flow

1. **API Layer** (`src/api/`): Pure data fetchers that throw errors and return data directly. No error handling here.
2. **Query Layer** (`src/queries/`): TanStack Query (vue-query) hooks for server state. Handles caching, refetching, and mutations. Mutations use `toActionResult` wrapper and `createMutationErrorHandler` for error handling. Query key factories live in `src/queries/query-keys.ts`.
3. **Store Layer** (`src/stores/`): Pinia stores for client-side state only (auth, user, notification, preferences). Not used for server data — that goes through the query layer.
4. **Component Layer**: UI rendering only. Uses query hooks or composables for data. No error handling in components.

### Error Handling

- API functions throw errors (never return `{data, error}` objects)
- Mutations handle errors via `createMutationErrorHandler` from `src/queries/mutation-utils.ts` with error keys from `src/config/error-messages.ts`
- Client-side stores catch errors using `useError().handleError()` for non-query operations
- Components do not implement error handling logic

### Query Layer (`src/queries/`)

- Use `MaybeRefOrGetter<T>` with `toValue()` for reactive query hook parameters
- Use targeted invalidation (invalidate specific queries) over broad invalidation (`queryKeys.*.all`)
- Wrap mutations with `toActionResult` to return `{ success, error? }` instead of throwing
- Query key factories in `query-keys.ts` follow the pattern: `queryKeys.entity.list(userId)`, `queryKeys.entity.detail(id, userId)`

### Composables (`src/composables/`)

- Called only in `<script setup>` or from other composables
- Use query hooks directly for server data — don't go through stores
- Extract shared logic into composables (e.g., `useItemCompletion` for duplicated toggle logic)
- Prefer VueUse utilities (`@vueuse/core`) over custom implementations

## Code Standards

### TypeScript

- Use types over interfaces
- Avoid enums; use plain objects
- Use `unknown` with type guards instead of `any`
- Use Supabase-generated types (`Tables`, `TablesInsert`, `TablesUpdate`)
- Use `import type` syntax for type-only imports

### Vue Components

- Always use Composition API with `<script setup>`
- Don't pass functions as props; emit events instead
- Use `withDefaults()` for component props with defaults
- Avoid logic in templates; extract to `<script setup>`
- `$q` is available in templates automatically (no need for `useQuasar`)
- Use Vue 3.3+ object emit syntax: `defineEmits<{ 'event-name': [payload: Type] }>()`

### Quasar

- Use Quasar utility classes for spacing (`q-pa-*`, `q-ma-*`) over custom CSS
- Use `q-btn` with `to` prop for navigation instead of `@click="$router.push()"`
- Leverage Quasar components/plugins over custom implementations
- Use QDrawer/QFooter for persistent navigation instead of QPageSticky — they integrate with QLayout's view string and handle page container padding automatically
- QLayout view string: use `hHh Lpr fff` — lowercase `l` in position 1 puts the drawer inside the header row (usually wrong)
- QFooter forces white text on children — override with explicit text/background color classes on content inside it

### CSS

- Store design tokens (spacing, letter-spacing, border-radius, etc.) as CSS custom properties in `src/css/theme.scss`
- Add utility classes to `src/css/app.scss` rather than using inline styles for repeated patterns

## Testing

- Use Vitest with `@vue/test-utils`
- Co-locate test files with source (`.test.ts` extension)
- Use `installQuasarPlugin()` for component tests
- Use `createTestingPinia({ createSpy: vi.fn })` for store testing
- Mock query hooks (`src/queries/*`) with `vi.mock()` returning objects with `data`, `isPending`, `mutateAsync` refs/fns
- For components using query hooks, mock the query module rather than providing a real `QueryClient`
- For Vue components, do not use a root `describe` block
- Check `__mocks__` folder before using `vi.mock()`

## Domain Concepts

- **Template**: Reusable budget blueprint with categories and amounts
- **Plan**: Active budget instance from a template for a specific date range
- **Expense**: Transaction linked to a plan and category
- **Category**: Predefined expense types (hierarchical with parent-child relationships)
