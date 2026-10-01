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
        :composition="compositionByTemplateId?.[item.id] ?? null"
        @edit="emit('edit', $event)"
        @export="emit('export', $event)"
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
import type { TemplateComposition } from 'src/composables/useTemplatesPage'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'export', id: string): void
  (e: 'share', id: string): void
  (e: 'delete', template: TemplateWithPermission): void
}>()

withDefaults(
  defineProps<{
    templates: TemplateWithPermission[]
    title?: string
    compositionByTemplateId?: Record<string, TemplateComposition>
    chipColor?: string
  }>(),
  {
    chipColor: 'primary',
  },
)
</script>
