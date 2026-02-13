<template>
  <q-card
    class="q-pa-md"
    flat
  >
    <SectionHeader
      icon="eva-info-outline"
      title="Plan Information"
      icon-size="24px"
    />

    <div class="q-mb-md">
      <label
        for="plan-name-label"
        class="form-label form-label--required"
      >
        Plan Name
      </label>
      <q-input
        for="plan-name-label"
        :model-value="modelValue.name"
        placeholder="e.g., March Budget"
        dense
        outlined
        no-error-icon
        inputmode="text"
        :readonly="readonly"
        :rules="[(val) => !!val || 'Plan name is required']"
        hide-bottom-space
        @update:model-value="(val) => updateField('name', String(val ?? ''))"
      />
    </div>

    <div class="row q-col-gutter-sm">
      <div class="col-6">
        <label
          for="plan-start-date-label"
          class="form-label form-label--required"
        >
          Start Date
        </label>
        <q-input
          for="plan-start-date-label"
          :model-value="modelValue.startDate"
          placeholder="YYYY-MM-DD"
          dense
          outlined
          no-error-icon
          inputmode="none"
          :readonly="readonly"
          :rules="startDateRules"
          hide-bottom-space
          @update:model-value="(val) => handleStartDateUpdate(String(val ?? ''))"
        >
          <template #append>
            <q-icon
              name="eva-calendar-outline"
              class="cursor-pointer"
            >
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date
                  :model-value="modelValue.startDate"
                  mask="YYYY-MM-DD"
                  @update:model-value="handleStartDateUpdate"
                >
                  <div class="row items-center justify-end">
                    <q-btn
                      v-close-popup
                      label="Cancel"
                      color="primary"
                      flat
                      no-caps
                    />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-6">
        <label
          for="plan-end-date-label"
          class="form-label form-label--required"
        >
          End Date
        </label>
        <q-input
          for="plan-end-date-label"
          :model-value="modelValue.endDate"
          placeholder="YYYY-MM-DD"
          dense
          no-error-icon
          outlined
          readonly
          :rules="[(val: string) => !!val || 'End date is required']"
          hint="Auto-calculated from template"
          :hide-bottom-space="false"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from 'src/components/shared/SectionHeader.vue'
import { calculateEndDate } from 'src/utils/plans'

interface PlanFormData {
  name: string
  startDate: string
  endDate: string
}

const props = withDefaults(
  defineProps<{
    modelValue: PlanFormData
    templateDuration?: string
    readonly?: boolean
  }>(),
  {
    templateDuration: '',
    readonly: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: PlanFormData): void
}>()

const startDateRules = computed(() => [
  (val: string) => !!val || 'Start date is required',
  (val: string) => {
    if (!val) return true
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      return 'Date must be in YYYY-MM-DD format'
    }
    const date = new Date(val)
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date'
    }
    if (date.toISOString().split('T')[0] !== val) {
      return 'Please enter a valid date'
    }
    return true
  },
])

function updateField(field: keyof PlanFormData, value: string): void {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function handleStartDateUpdate(newDate: string): void {
  const updatedForm = { ...props.modelValue, startDate: newDate }

  // Auto-calculate end date if template duration is provided
  if (props.templateDuration && newDate) {
    const startDate = new Date(newDate)
    if (!isNaN(startDate.getTime())) {
      const endDate = calculateEndDate(
        startDate,
        props.templateDuration as 'weekly' | 'monthly' | 'yearly',
      )
      updatedForm.endDate = endDate?.toISOString().split('T')[0] || ''
    }
  }

  emit('update:modelValue', updatedForm)
}
</script>
