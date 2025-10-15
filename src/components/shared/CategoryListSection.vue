<template>
  <q-card
    flat
    :bordered="bordered"
    :class="padding ? 'q-pa-md' : ''"
  >
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center">
        <q-icon
          :name="headerIcon"
          class="q-mr-sm"
          size="20px"
        />
        <h2 class="text-h6 q-my-none">{{ headerTitle }}</h2>
        <q-chip
          v-if="showItemCount && itemCount && itemCount > 0"
          :label="itemCount"
          color="primary"
          text-color="white"
          size="sm"
          class="q-ml-sm"
        />
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          v-if="showExpandToggle && hasCategories"
          flat
          :icon="allExpanded ? 'eva-collapse-outline' : 'eva-expand-outline'"
          :label="$q.screen.lt.md ? '' : allExpanded ? 'Collapse All' : 'Expand All'"
          color="primary"
          no-caps
          @click="$emit('toggle-expand')"
        />
        <slot name="header-actions" />
      </div>
    </div>

    <!-- Duplicate Items Warning Banner (shown before categories) -->
    <q-banner
      v-if="isDuplicateWarningVisible && duplicateBannerPosition === 'top'"
      :class="duplicateBannerClass"
      class="q-mb-md"
      rounded
    >
      <template #avatar>
        <q-icon name="eva-alert-triangle-outline" />
      </template>
      <slot name="duplicate-message">
        You have duplicate item names within the same category. Please use unique names.
      </slot>
    </q-banner>

    <!-- Empty State -->
    <div
      v-if="!hasCategories"
      :class="emptyStateClass"
    >
      <slot name="empty-state">
        <q-banner
          dense
          rounded
          :class="$q.dark.isActive ? 'bg-grey-9 text-grey-3' : 'bg-grey-1 text-grey-7'"
        >
          <template #avatar>
            <q-icon
              name="eva-info-outline"
              :size="$q.screen.lt.md ? 'sm' : 'md'"
            />
          </template>
          {{ emptyMessage }}
        </q-banner>
      </slot>
    </div>

    <!-- Category List -->
    <div
      v-else
      class="q-mb-lg"
    >
      <slot name="categories" />
    </div>

    <!-- Duplicate Items Warning Banner (shown after categories) -->
    <div
      v-if="isDuplicateWarningVisible && duplicateBannerPosition === 'bottom'"
      class="q-mt-md"
    >
      <q-banner
        rounded
        :class="duplicateBannerClass"
      >
        <template #avatar>
          <q-icon name="eva-alert-triangle-outline" />
        </template>
        <slot name="duplicate-message">
          You have duplicate item names within the same category. Please use unique names.
        </slot>
      </q-banner>
    </div>

    <!-- Summary Section (Total Amount) -->
    <slot name="summary" />
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  headerIcon: string
  headerTitle: string
  hasCategories: boolean
  itemCount?: number
  showItemCount?: boolean
  showExpandToggle?: boolean
  allExpanded?: boolean
  hasDuplicates?: boolean
  showDuplicateWarning?: boolean
  duplicateBannerPosition?: 'top' | 'bottom'
  duplicateBannerClass?: string
  emptyMessage?: string
  emptyStateClass?: string
  bordered?: boolean
  padding?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemCount: 0,
  showItemCount: false,
  showExpandToggle: true,
  allExpanded: false,
  hasDuplicates: false,
  showDuplicateWarning: true,
  duplicateBannerPosition: 'top',
  duplicateBannerClass: '',
  emptyMessage: 'No items yet',
  emptyStateClass: '',
  bordered: true,
  padding: true,
})

defineEmits<{
  (e: 'toggle-expand'): void
}>()

const isDuplicateWarningVisible = computed(
  () => props.showDuplicateWarning && props.hasDuplicates && props.hasCategories,
)
</script>
