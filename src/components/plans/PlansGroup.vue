<template>
  <ItemsGroup
    :items="plans"
    :title="title"
    icon="eva-calendar-outline"
    :chip-color="chipColor || 'primary'"
    :hide-shared-badge="hideSharedBadge || false"
    @edit="emit('edit', $event)"
    @share="emit('share', $event)"
    @delete="emit('delete', $event)"
  >
    <template #item-card="{ item, hideSharedBadge, onEdit, onDelete, onShare }">
      <PlanCard
        :plan="item"
        :hide-shared-badge="hideSharedBadge"
        @edit="onEdit"
        @delete="onDelete"
        @share="onShare"
      />
    </template>
  </ItemsGroup>
</template>

<script setup lang="ts">
import ItemsGroup from 'src/components/shared/ItemsGroup.vue'
import PlanCard from './PlanCard.vue'
import type { PlanWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', plan: PlanWithPermission): void
}>()

withDefaults(
  defineProps<{
    plans: PlanWithPermission[]
    title: string
    chipColor?: string
    hideSharedBadge?: boolean
  }>(),
  {
    chipColor: 'primary',
    hideSharedBadge: false,
  },
)
</script>
