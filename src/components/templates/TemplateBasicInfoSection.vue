<template>
  <q-card
    flat
    class="q-mb-md"
  >
    <q-card-section>
      <SectionHeader
        icon="eva-info-outline"
        title="Basic Information"
      />
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-8">
          <label
            for="template-name-label"
            class="form-label form-label--required"
          >
            Template Name
          </label>
          <q-input
            v-if="readonly"
            for="template-name-label"
            :model-value="modelValue.name"
            dense
            outlined
            readonly
            no-error-icon
            inputmode="text"
            hide-bottom-space
          />
          <q-input
            v-else
            for="template-name-label"
            :model-value="modelValue.name"
            placeholder="e.g., Monthly Expenses"
            dense
            outlined
            no-error-icon
            inputmode="text"
            :rules="nameRules"
            :error="nameError"
            :error-message="nameErrorMessage"
            :hide-bottom-space="!nameError"
            @update:model-value="(val) => updateName(String(val ?? ''))"
          />
        </div>
        <div class="col-6 col-sm-2">
          <label
            for="template-duration-label"
            class="form-label"
          >
            Duration
          </label>
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
            for="template-duration-label"
            :model-value="modelValue.duration"
            :options="durationOptions"
            dense
            outlined
            emit-value
            map-options
            hide-bottom-space
            @update:model-value="updateDuration"
          />
        </div>
        <div class="col-6 col-sm-2">
          <label
            for="template-currency-label"
            class="form-label"
          >
            Currency
          </label>
          <q-chip
            v-if="readonly"
            :label="modelValue.currency"
            color="primary"
            text-color="primary"
            :ripple="false"
            outline
          />
          <q-select
            v-else
            for="template-currency-label"
            :model-value="modelValue.currency"
            :options="currencyOptions"
            dense
            outlined
            emit-value
            map-options
            hide-bottom-space
            @update:model-value="updateCurrency"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from 'src/components/shared/SectionHeader.vue'
import type { CurrencyCode } from 'src/utils/currency'

interface TemplateBasicInfo {
  name: string
  duration: string
  currency: CurrencyCode
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

const currencyOptions = computed(() => [
  {
    label: 'EUR',
    value: 'EUR',
  },
  {
    label: 'USD',
    value: 'USD',
  },
  {
    label: 'GBP',
    value: 'GBP',
  },
  {
    label: 'JPY',
    value: 'JPY',
  },
])

function updateName(name: string): void {
  emit('update:modelValue', { ...props.modelValue, name })
  emit('clear-name-error')
}

function updateDuration(duration: string): void {
  emit('update:modelValue', { ...props.modelValue, duration })
}

function updateCurrency(currency: CurrencyCode): void {
  emit('update:modelValue', { ...props.modelValue, currency })
}
</script>
