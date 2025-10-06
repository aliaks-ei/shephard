<template>
  <q-card
    flat
    class="q-mb-lg"
  >
    <SectionHeader
      icon="eva-info-outline"
      title="Plan Information"
      icon-size="24px"
    />

    <q-input
      :model-value="modelValue.name"
      label="Plan Name"
      outlined
      no-error-icon
      :readonly="readonly"
      :rules="[(val) => !!val || 'Plan name is required']"
      :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mb-md'"
      @update:model-value="(val) => updateField('name', String(val ?? ''))"
    />

    <div
      class="row"
      :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
    >
      <div class="col-12 col-sm-6">
        <q-input
          :model-value="modelValue.startDate"
          label="Start Date"
          outlined
          no-error-icon
          :readonly="readonly"
          :rules="startDateRules"
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
      <div class="col-12 col-sm-6">
        <q-input
          :model-value="modelValue.endDate"
          label="End Date"
          no-error-icon
          outlined
          readonly
          :rules="[(val: string) => !!val || 'End date is required']"
          hint="Auto-calculated from template"
        />
      </div>
    </div>

    <div
      v-if="templateDuration"
      class="text-caption text-grey-6 q-mt-sm"
    >
      Template duration: {{ templateDuration }}
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
