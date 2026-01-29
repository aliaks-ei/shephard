# Component Patterns Reference

This document describes established UI patterns used throughout Shephard. Follow these patterns for consistency.

## Card Pattern

Cards are the primary container for content. Use `q-card` with consistent styling.

### Standard Card

```vue
<q-card :bordered="$q.dark.isActive" class="shadow-1">
  <q-card-section>
    <!-- Content -->
  </q-card-section>
</q-card>
```

Key conventions:

- Use `bordered` only in dark mode (`:bordered="$q.dark.isActive"`)
- Use `shadow-1` for subtle elevation
- Use `flat` for cards inside other cards or dialogs

### Clickable Card with Item

For cards that act as list items:

```vue
<q-card :bordered="$q.dark.isActive" class="full-height shadow-1">
  <q-item
    class="full-height q-pa-md"
    clickable
    @click="handleClick"
  >
    <q-item-section class="justify-between">
      <!-- Header row -->
      <div class="row items-start justify-between">
        <div class="col">
          <h3 class="text-h6 q-mt-none q-mb-xs">{{ title }}</h3>
        </div>
        <div class="col-auto">
          <!-- Actions/indicators -->
        </div>
      </div>

      <!-- Content -->
      <div class="q-mt-lg">
        <!-- Values, status chips, metadata -->
      </div>
    </q-item-section>
  </q-item>
</q-card>
```

## Empty State Pattern

Use `EmptyState.vue` component for empty lists. Located at `src/components/shared/EmptyState.vue`.

```vue
<EmptyState
  :has-search-query="!!searchQuery"
  empty-icon="eva-calendar-outline"
  empty-title="No plans yet"
  empty-description="Create your first plan to start tracking expenses"
  search-title="No plans found"
  search-description="Try adjusting your search terms"
  create-button-label="Create Plan"
  @create="handleCreate"
  @clear-search="clearSearch"
/>
```

Structure:

- Icon (4rem, `text-grey-4`)
- Title (`text-h5`, `text-grey-7`)
- Description (`text-body2`, `text-grey-5`)
- Action buttons

## Dialog Pattern

Use `q-dialog` with consistent structure.

### Confirmation Dialog

Reference: `src/components/shared/DeleteDialog.vue`

```vue
<q-dialog v-model="isOpen">
  <q-card style="min-width: 350px">
    <q-card-section>
      <div class="text-h6">{{ title }}</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <p class="text-body2 text-grey-7">{{ message }}</p>
      <q-banner
        v-if="warningMessage"
        class="bg-warning-1 text-warning q-mt-md"
        rounded
      >
        <template #avatar>
          <q-icon name="eva-alert-triangle-outline" />
        </template>
        {{ warningMessage }}
      </q-banner>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        flat
        label="Cancel"
        no-caps
        v-close-popup
      />
      <q-btn
        unelevated
        color="negative"
        :label="confirmLabel"
        no-caps
        @click="confirm"
      />
    </q-card-actions>
  </q-card>
</q-dialog>
```

### Form Dialog

```vue
<q-dialog v-model="isOpen">
  <q-card style="min-width: 400px; max-width: 500px">
    <q-card-section>
      <div class="text-h6">{{ title }}</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-form @submit.prevent="handleSubmit">
        <!-- Form fields -->
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Cancel" no-caps v-close-popup />
      <q-btn
        unelevated
        color="primary"
        label="Save"
        no-caps
        type="submit"
        :loading="isLoading"
      />
    </q-card-actions>
  </q-card>
</q-dialog>
```

## List with Menu Pattern

For items with contextual menus:

```vue
<q-btn flat round size="sm" icon="eva-more-vertical-outline" class="text-grey-7" @click.stop>
  <q-menu>
    <q-list style="min-width: 150px">
      <q-item clickable v-close-popup @click="handleEdit">
        <q-item-section avatar>
          <q-icon name="eva-edit-outline" />
        </q-item-section>
        <q-item-section>Edit</q-item-section>
      </q-item>

      <q-separator />

      <q-item clickable v-close-popup @click="handleDelete">
        <q-item-section avatar>
          <q-icon name="eva-trash-2-outline" class="text-negative" />
        </q-item-section>
        <q-item-section class="text-negative">Delete</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</q-btn>
```

## Status Chip Pattern

For displaying status:

```vue
<q-chip :color="statusColor" :icon="statusIcon" text-color="white" size="sm" square>
  {{ statusText }}
</q-chip>
```

Common status colors:

- Active/Current: `primary`
- Completed: `positive`
- Cancelled/Expired: `grey-5`
- Warning: `warning`

## Form Field Pattern

Standard form field with validation:

```vue
<q-input
  v-model="value"
  :label="label"
  :rules="[(v) => !!v || 'Required']"
  outlined
  no-error-icon
/>
```

Key conventions:

- Use `outlined` variant
- Use `no-error-icon` (errors shown via message)
- Use `no-caps` on buttons
- Use `unelevated` for primary buttons, `flat` for secondary

## Section Header Pattern

For section titles within pages:

```vue
<div class="row items-center justify-between q-mb-md">
  <div class="text-subtitle1 text-weight-medium">
    {{ sectionTitle }}
  </div>
  <q-btn
    v-if="showAction"
    flat
    dense
    no-caps
    color="primary"
    :label="actionLabel"
    @click="handleAction"
  />
</div>
```

## Loading States

### Skeleton Loading

Use Quasar's `q-skeleton` for loading states:

```vue
<template v-if="isLoading">
  <q-skeleton
    type="rect"
    height="100px"
    class="q-mb-md"
  />
  <q-skeleton
    type="rect"
    height="100px"
    class="q-mb-md"
  />
</template>
<template v-else>
  <!-- Actual content -->
</template>
```

### Button Loading

```vue
<q-btn :loading="isLoading" :disable="isLoading" @click="handleClick">
  Save
</q-btn>
```

## Common Class Combinations

Frequently used Quasar utility class patterns:

```
q-pa-md q-gutter-md          // Container with padding and gap
q-mt-none q-mb-xs            // Reset top margin, small bottom
text-h6 q-mt-none            // Heading without extra top margin
text-caption text-grey-6     // Secondary metadata text
text-subtitle1 text-weight-bold text-primary  // Emphasized value
row items-center justify-between  // Horizontal layout
col-auto                     // Auto-width column
full-height                  // 100% height
window-height                // min-height: 100vh
```

## Color & Opacity Classes

Quasar provides color classes with opacity suffixes (1-14 scale, where 1 = 7%, 14 = 100%):

### Text Opacity

```
text-white-7                 // White text at ~50% opacity
text-white-10                // White text at ~70% opacity
text-grey-7                  // Grey text (for secondary/muted text)
text-grey-6                  // Lighter grey (for captions)
```

### Background Opacity

```
bg-white-10                  // Semi-transparent white background
bg-primary-1                 // Very light primary tint
bg-red-1 / bg-green-1        // Light semantic backgrounds for alerts
```

### Component Color Props

```vue
<!-- q-avatar with semi-transparent background -->
<q-avatar color="white-10" text-color="white" size="48px">
  <q-icon name="eva-icon" />
</q-avatar>

<!-- Solid primary background -->
<q-avatar color="primary" text-color="white" size="48px">
  <q-icon name="eva-icon" />
</q-avatar>
```

## Responsive Visibility Classes

Show/hide elements at breakpoints:

```
xs    // 0-599px
sm    // 600-1023px
md    // 1024-1439px
lg    // 1440-1919px
xl    // 1920px+

gt-xs // > 599px (greater than xs)
gt-sm // > 1023px
gt-md // > 1439px
lt-sm // < 600px (less than sm)
lt-md // < 1024px
lt-lg // < 1440px
```

Example:

```vue
<!-- Show only on mobile -->
<div class="lt-md">Mobile only</div>

<!-- Show only on desktop -->
<div class="gt-sm">Desktop only</div>
```

## Icon Container Pattern

For fixed-size icon containers, use `q-avatar` instead of custom divs:

```vue
<!-- WRONG: Custom div with inline styles -->
<div style="width: 48px; height: 48px; border-radius: 50%;">
  <q-icon name="eva-home-outline" />
</div>

<!-- CORRECT: Use q-avatar -->
<q-avatar size="48px" color="primary" text-color="white">
  <q-icon name="eva-home-outline" size="24px" />
</q-avatar>
```

Common configurations:

- **Solid background**: `color="primary"` or `color="positive"`
- **Semi-transparent**: `color="white-10"` or `color="primary-2"`
- **Rounded square**: add `rounded` prop
- **With image**: `<q-avatar><img src="..." /></q-avatar>`

Sizing guide:
| Avatar size | Icon size | Use case |
|-------------|-----------|----------|
| `24px` | `12px` | Inline with text |
| `32px` | `16px` | List item icons |
| `48px` | `24px` | Card headers, features |
| `64px` | `32px` | Profile pictures |
| `80px` | `40px` | Hero sections |
