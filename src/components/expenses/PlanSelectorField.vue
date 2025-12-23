<template>
  <div>
    <label
      for="plan-selector-label"
      class="form-label form-label--required"
    >
      Plan
    </label>
    <q-select
      :model-value="modelValue"
      for="plan-selector-label"
      :options="planOptions"
      option-label="label"
      option-value="value"
      outlined
      dense
      emit-value
      map-options
      :hide-bottom-space="!showAutoSelectHint"
      :hint="showAutoSelectHint ? 'Most recently used plan selected' : undefined"
      :readonly="readonly"
      :loading="loading"
      :rules="[(val) => !!val || 'Plan is required']"
      :display-value="displayValue"
      @update:model-value="handlePlanSelected"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label caption>
              {{ formatDateRange(scope.opt.startDate, scope.opt.endDate) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              :color="getStatusColor(scope.opt.status)"
              text-color="white"
              size="sm"
            >
              {{ scope.opt.status }}
            </q-chip>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            No plans available. Create a plan first.
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script setup lang="ts">
import { formatDateRange, getStatusColor } from 'src/utils/plans'

export interface PlanOption {
  label: string
  value: string
  status: string
  startDate: string
  endDate: string
  currency: string
}

interface Props {
  modelValue: string | null
  planOptions: PlanOption[]
  readonly?: boolean
  loading?: boolean
  showAutoSelectHint?: boolean
  displayValue?: string
}

withDefaults(defineProps<Props>(), {
  readonly: false,
  loading: false,
  showAutoSelectHint: false,
  displayValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'plan-selected', value: string | null): void
}>()

const handlePlanSelected = (planId: string | null) => {
  emit('update:modelValue', planId)
  emit('plan-selected', planId)
}
</script>
