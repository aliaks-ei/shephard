<template>
  <q-card
    flat
    bordered
    class="q-pa-md q-mb-lg"
  >
    <SectionHeader
      icon="eva-file-text-outline"
      title="Select Template"
      icon-size="24px"
      spacing="q-mb-xs"
    />

    <div class="text-body2 text-grey-6 q-mb-md">
      Select a template to base your plan on. You can modify the items and amounts after selection.
    </div>

    <q-select
      :model-value="modelValue"
      :dense="$q.screen.lt.md"
      :options="templateOptions"
      option-label="name"
      option-value="id"
      label="Choose Template"
      outlined
      emit-value
      map-options
      :loading="loading"
      :error="error"
      :error-message="errorMessage"
      @update:model-value="handleTemplateSelected"
    >
      <template #option="scope">
        <q-item
          v-bind="scope.itemProps"
          class="q-pa-md"
        >
          <q-item-section>
            <div class="row items-center justify-between">
              <div class="row">
                <div class="text-weight-medium">{{ scope.opt.name }}</div>
                <q-badge
                  color="primary"
                  text-color="white"
                  class="q-px-sm q-py-xs q-ml-sm"
                >
                  <q-icon
                    name="eva-clock-outline"
                    size="12px"
                    class="q-mr-xs"
                  />
                  {{ scope.opt.duration }}
                </q-badge>
              </div>
              <div class="col-auto row items-center q-gutter-sm">
                <div class="text-weight-bold text-primary">
                  {{ formatCurrency(scope.opt.total, scope.opt.currency) }}
                </div>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey"> No templates available </q-item-section>
        </q-item>
      </template>
    </q-select>

    <div v-if="selectedTemplate">
      <div class="text-subtitle2 q-mb-sm">Selected Template:</div>
      <TemplateCard
        :template="selectedTemplate"
        readonly
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
import SectionHeader from 'src/components/shared/SectionHeader.vue'
import TemplateCard from 'src/components/templates/TemplateCard.vue'
import { formatCurrency } from 'src/utils/currency'
import type { TemplateWithItems } from 'src/api'

interface TemplateOption {
  id: string
  name: string
  duration: string
  total: number
  currency: string
  permission_level: string
}

withDefaults(
  defineProps<{
    modelValue: string | null
    templateOptions: TemplateOption[]
    selectedTemplate: TemplateWithItems | null
    loading?: boolean
    error?: boolean
    errorMessage?: string
  }>(),
  {
    loading: false,
    error: false,
    errorMessage: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'template-selected', templateId: string | null): void
}>()

function handleTemplateSelected(templateId: string | null): void {
  emit('update:modelValue', templateId)
  emit('template-selected', templateId)
}
</script>
