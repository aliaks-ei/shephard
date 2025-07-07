<template>
  <div class="row items-center justify-between q-mb-md">
    <div class="row items-center text-h6 text-weight-medium">
      <q-icon
        name="eva-person-outline"
        class="q-mr-sm"
      />
      {{ title }}
      <q-chip
        :label="templates.length"
        :color="chipColor"
        text-color="white"
        size="sm"
        class="q-ml-sm"
      />
    </div>
  </div>

  <div class="row q-col-gutter-md">
    <div
      v-for="template in templates"
      :key="template.id"
      class="col-12 col-sm-6 col-lg-4 col-xl-3"
    >
      <ExpenseTemplateCard
        :template="template"
        :hide-shared-badge="!!hideSharedBadge"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @share="emit('share', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
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
