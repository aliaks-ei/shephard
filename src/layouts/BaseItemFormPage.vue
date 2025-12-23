<template>
  <DetailPageLayout
    :page-title="pageTitle"
    :banners="computedBanners"
    :is-loading="isLoading ?? false"
    :actions="actions ?? []"
    :actions-visible="actionsVisible ?? true"
    :show-read-only-badge="showReadOnlyBadge ?? false"
    @back="$emit('back')"
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

interface Props {
  pageTitle: string
  isLoading?: boolean
  actions?: ActionBarAction[]
  actionsVisible?: boolean
  showReadOnlyBadge?: boolean
  isEditMode?: boolean
  isOwner?: boolean
  canEdit?: boolean
  additionalBanners?: BannerConfig[]
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  actionsVisible: true,
  showReadOnlyBadge: false,
  isEditMode: true,
  isOwner: true,
  canEdit: true,
})

defineEmits<{
  (e: 'back'): void
  (e: 'action-clicked', key: string): void
}>()

const computedBanners = computed(() => {
  const bannersList: BannerConfig[] = []

  if (!props.isEditMode) {
    bannersList.push({
      type: 'readonly',
      class: 'bg-orange-1 text-orange-8',
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
