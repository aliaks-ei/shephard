<template>
  <ItemsGroup
    :items="templates"
    :title="title"
    icon="eva-file-text-outline"
    :chip-color="chipColor || 'primary'"
  >
    <template #item-card="{ item }">
      <TemplateCard
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
import TemplateCard from './TemplateCard.vue'
import type { TemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', template: TemplateWithPermission): void
}>()

withDefaults(
  defineProps<{
    templates: TemplateWithPermission[]
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
