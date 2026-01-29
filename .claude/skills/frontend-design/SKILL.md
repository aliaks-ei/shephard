---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces aligned with this Vue 3 + Quasar PWA expense app. This skill should be used when building or beautifying UI to stay consistent with project conventions and user-facing flows.
---

This skill tailors UI work to Shephard's expense management PWA. The goal is elegant, trustworthy finance UI with a clear visual hierarchy and a calm, confident tone.

The user provides UI requirements (component/page/flow) and constraints. Always implement real, working Vue 3 + Quasar code.

## When to Use This Skill

This skill should be triggered for requests like:

- "Build a new card component for X"
- "Add a form for creating/editing Y"
- "Make this page look better"
- "Add empty state to this list"
- "Create a dialog for Z"
- "Style this component"
- "Add loading/error states"

## Design Thinking

Before coding, align with product context:

- **Purpose**: What financial task is the user trying to complete quickly and safely?
- **Tone**: Calm, precise, modern. Avoid novelty-first aesthetics that reduce trust.
- **Constraints**: Vue 3, Quasar, mobile-first PWA, accessibility.
- **Differentiation**: Clear hierarchy, helpful microcopy, and minimal friction.

## Project-Fit Guidelines

Focus on:

- **Quasar-first**: Prefer Quasar components and spacing utilities over custom CSS.
- **Icons**: Use Eva icons (`eva-*` prefix). Check existing components for established icon choices (e.g., `eva-plus-outline`, `eva-trash-2-outline`, `eva-edit-outline`).
- **Hierarchy**: Labels as captions, values as primary text; emphasize totals and key actions.
- **Responsiveness**: Use Quasar grid and responsive classes; design for mobile first.
- **Feedback**: Always include clear loading, empty, and error states.
- **Consistency**: Reuse patterns for expenses, categories, templates, and plans.

Avoid generic, flashy templates. The UI should feel purpose-built for personal finance: clean, reliable, and fast to scan.

## Styling Rules (IMPORTANT)

**NEVER use `<style>` blocks or inline styles.** Always use Quasar utility classes and components.

### Forbidden Patterns

```vue
<!-- WRONG: Custom CSS in style block -->
<style scoped>
.container {
  padding: 16px;
  display: flex;
  gap: 8px;
}
.title {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>

<!-- WRONG: Inline styles -->
<div style="display: flex; align-items: center; gap: 12px;"></div>
```

### Correct Alternatives

| Instead of...                       | Use...                                             |
| ----------------------------------- | -------------------------------------------------- |
| `style="display: flex"`             | `class="flex"` or `class="row"` / `class="column"` |
| `style="align-items: center"`       | `class="items-center"`                             |
| `style="justify-content: center"`   | `class="justify-center"`                           |
| `style="gap: 16px"`                 | `class="q-gutter-md"`                              |
| `style="padding: 16px"`             | `class="q-pa-md"`                                  |
| `style="margin-bottom: 24px"`       | `class="q-mb-lg"`                                  |
| `style="width: 48px; height: 48px"` | `<q-avatar size="48px">`                           |
| `style="border-radius: 50%"`        | `<q-avatar>` (circular by default)                 |
| `style="min-height: 100vh"`         | `class="window-height"`                            |
| `style="opacity: 0.7"`              | `class="text-grey-7"` or `class="text-white-7"`    |
| `style="background: rgba(...)"`     | `class="bg-white-10"` or `color="white-10"` prop   |
| `style="font-weight: 600"`          | `class="text-weight-medium"`                       |
| `style="font-size: 1.5rem"`         | `class="text-h5"`                                  |

### When Scoped Styles Are Acceptable

Only use `<style scoped>` for properties with no Quasar equivalent:

- `max-width` constraints
- Using SCSS variables like `$card-border-radius`, `$primary`
- Complex CSS that can't be expressed with utility classes

Keep scoped styles minimal (1-3 properties max).

## Layout Rules

### Vue Router Layouts

Files in `src/layouts/` are Vue Router layouts. They render child routes via `<router-view />`:

```vue
<!-- WRONG: Using slot (for regular components only) -->
<slot />

<!-- CORRECT: Using router-view (for Vue Router layouts) -->
<router-view />
```

### Regular Components

Files in `src/components/` are regular Vue components. They use `<slot />` for content projection:

```vue
<!-- Card wrapper component -->
<q-card class="q-pa-md">
  <slot />
</q-card>
```

## Resources

When implementing UI:

1. **Use the `quasar-docs` skill** to look up Quasar component APIs and usage patterns
2. **Check design tokens** in `references/design-tokens.md` for:
   - Color palette and semantic usage (when to use `$positive` vs `$green`)
   - CSS variables (`--radius-*`, `--shadow-*`)
   - Light/dark mode considerations
3. **Follow established patterns** in `references/component-patterns.md` for:
   - Card layouts and clickable items
   - Empty states
   - Dialogs (confirmation and form)
   - List menus and status chips
   - Loading states
4. **Review existing components** in `src/components/shared/` for reusable building blocks

## Key Files

- Design tokens: `src/css/quasar.variables.scss`, `src/css/theme.scss`
- Shared components: `src/components/shared/`
- Page layouts: `src/pages/`
