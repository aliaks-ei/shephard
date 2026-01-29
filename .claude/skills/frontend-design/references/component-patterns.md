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
```
