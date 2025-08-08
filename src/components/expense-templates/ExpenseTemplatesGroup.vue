<template>
  <ItemsGroup
    :items="templates"
    :title="title"
    icon="eva-file-text-outline"
    :chip-color="chipColor || 'primary'"
  >
    <template #item-card="{ item }">
      <ExpenseTemplateCard
        :template="item"
        :hide-shared-badge="hideSharedBadge || false"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @share="emit('share', $event)"
      />
    </template>
  </ItemsGroup>
</template>

<script setup lang="ts">
import ItemsGroup from 'src/components/shared/ItemsGroup.vue'
import ExpenseTemplateCard from './ExpenseTemplateCard.vue'
import type { ExpenseTemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', template: ExpenseTemplateWithPermission): void
}>()

withDefaults(
  defineProps<{
    templates: ExpenseTemplateWithPermission[]
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
