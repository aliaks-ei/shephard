<template>
  <AppDialogShell
    :model-value="modelValue"
    title="Export"
    body-class="q-pa-sm"
    :body-scrollable="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-list>
      <q-item
        clickable
        @click="emit('select-format', 'json')"
      >
        <q-item-section
          avatar
          class="min-w-auto"
        >
          <q-icon
            name="eva-code-outline"
            color="primary"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>JSON</q-item-label>
          <q-item-label caption>Structured export with full details</q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="emit('select-format', 'csv')"
      >
        <q-item-section
          avatar
          class="min-w-auto"
        >
          <q-icon
            name="eva-grid-outline"
            color="primary"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>CSV</q-item-label>
          <q-item-label caption>Spreadsheet-friendly item export</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </AppDialogShell>
</template>

<script setup lang="ts">
import AppDialogShell from './AppDialogShell.vue'
import type { ExportFormat } from 'src/utils/export'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select-format': [format: ExportFormat]
}>()
</script>
