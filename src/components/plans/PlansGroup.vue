<template>
  <ItemsGroup
    :items="plans"
    :title="title"
    icon="eva-calendar-outline"
    :chip-color="chipColor || 'primary'"
  >
    <template #item-card="{ item }">
      <PlanCard
        :plan="item"
        @edit="emit('edit', $event)"
        @export="emit('export', $event)"
        @delete="emit('delete', $event)"
        @share="emit('share', $event)"
        @cancel="emit('cancel', $event)"
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
  (e: 'export', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', plan: PlanWithPermission): void
  (e: 'cancel', plan: PlanWithPermission): void
}>()

withDefaults(
  defineProps<{
    plans: PlanWithPermission[]
    title: string
    chipColor?: string
  }>(),
  {
    chipColor: 'primary',
  },
)
</script>
