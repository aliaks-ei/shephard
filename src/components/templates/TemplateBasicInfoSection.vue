<template>
  <q-card
    flat
    bordered
    :class="$q.screen.lt.md ? 'q-pa-md q-mb-md' : 'q-px-md q-pt-md q-mb-lg'"
  >
    <div
      class="row"
      :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
    >
      <div class="col-12 col-sm-8">
        <SectionHeader
          icon="eva-info-outline"
          title="Basic Information"
        />
        <q-input
          v-if="readonly"
          :model-value="modelValue.name"
          label="Template Name"
          outlined
          readonly
          no-error-icon
          :hide-bottom-space="$q.screen.lt.md"
          :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mb-md'"
        />
        <q-input
          v-else
          :model-value="modelValue.name"
          label="Template Name"
          outlined
          no-error-icon
          :hide-bottom-space="$q.screen.lt.md"
          :rules="nameRules"
          :error="nameError"
          :error-message="nameErrorMessage"
          :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mb-md'"
          @update:model-value="(val) => updateName(String(val ?? ''))"
        />
      </div>
      <div class="col-12 col-sm">
        <SectionHeader
          icon="eva-calendar-outline"
          title="Duration"
          icon-size="24px"
        />
        <q-chip
          v-if="readonly"
          :label="modelValue.duration"
          color="primary"
          text-color="primary"
          class="text-capitalize"
          :ripple="false"
          outline
        />
        <q-select
          v-else
          :model-value="modelValue.duration"
          :options="durationOptions"
          outlined
          emit-value
          map-options
          style="min-width: 120px"
          @update:model-value="updateDuration"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from 'src/components/shared/SectionHeader.vue'

interface TemplateBasicInfo {
  name: string
  duration: string
}

const props = withDefaults(
  defineProps<{
    modelValue: TemplateBasicInfo
    readonly?: boolean
    nameError?: boolean
    nameErrorMessage?: string
  }>(),
  {
    readonly: false,
    nameError: false,
    nameErrorMessage: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: TemplateBasicInfo): void
  (e: 'clear-name-error'): void
}>()

const nameRules = computed(() => [
  (val: string) => {
    if (!val || val.trim().length === 0) {
      return 'Template name is required'
    }
    if (val.length > 100) {
      return 'Template name must be 100 characters or less'
    }
    return true
  },
])

const durationOptions = computed(() => [
  {
    label: 'Weekly',
    value: 'weekly',
  },
  {
    label: 'Monthly',
    value: 'monthly',
  },
  {
    label: 'Yearly',
    value: 'yearly',
  },
])

function updateName(name: string): void {
  emit('update:modelValue', { ...props.modelValue, name })
  emit('clear-name-error')
}

function updateDuration(duration: string): void {
  emit('update:modelValue', { ...props.modelValue, duration })
}
</script>
