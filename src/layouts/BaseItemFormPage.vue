<template>
  <DetailPageLayout
    :page-title="pageTitle"
    :banners="computedBanners"
    :is-loading="isLoading ?? false"
    :load-state="loadState ?? (isLoading ? 'loading' : 'ready')"
    :retrying="retrying ?? false"
    :entity-name="entityName ?? 'Item'"
    :entity-name-plural="entityNamePlural ?? 'items'"
    :actions="actions ?? []"
    :actions-visible="actionsVisible ?? true"
    :show-read-only-badge="showReadOnlyBadge ?? false"
    @back="$emit('back')"
    @retry="$emit('retry')"
    @action-clicked="$emit('action-clicked', $event)"
  >
    <slot />

    <template #dialogs>
      <slot name="dialogs" />
    </template>
  </DetailPageLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DetailPageLayout, { type BannerConfig } from './DetailPageLayout.vue'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'

type DetailPageLoadState = 'loading' | 'ready' | 'not-found' | 'denied' | 'error'

type Props = {
  pageTitle: string
  isLoading?: boolean
  loadState?: DetailPageLoadState
  retrying?: boolean
  entityName?: string
  entityNamePlural?: string
  actions?: ActionBarAction[]
  actionsVisible?: boolean
  showReadOnlyBadge?: boolean
  isEditMode?: boolean
  additionalBanners?: BannerConfig[]
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  actionsVisible: true,
  showReadOnlyBadge: false,
  isEditMode: true,
  entityName: 'Item',
  entityNamePlural: 'items',
})

defineEmits<{
  (e: 'back'): void
  (e: 'retry'): void
  (e: 'action-clicked', key: string): void
}>()

const computedBanners = computed(() => {
  const bannersList: BannerConfig[] = []

  if (!props.isEditMode) {
    bannersList.push({
      type: 'readonly',
      class: 'bg-warning-soft text-warning-strong',
      icon: 'eva-eye-outline',
      message: 'Read-only access. Contact the owner to edit.',
    })
  }

  if (props.additionalBanners) {
    bannersList.push(...props.additionalBanners)
  }

  return bannersList
})
</script>
