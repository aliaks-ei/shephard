<template>
  <div class="row q-col-gutter-sm q-mb-sm">
    <label
      class="col block"
      for="expense-amount-input"
    >
      <span class="form-label form-label--required">Amount</span>
      <q-input
        id="expense-amount-input"
        :model-value="displayAmount"
        placeholder="0.00"
        type="text"
        outlined
        dense
        no-error-icon
        inputmode="decimal"
        hide-bottom-space
        :rules="amountRules"
        :disable="disable"
        @update:model-value="emit('update:amount', $event)"
      />
    </label>

    <label
      class="col-auto block"
      for="expense-currency-input"
    >
      <span class="form-label">Currency</span>
      <q-select
        :model-value="selectedCurrency"
        id="expense-currency-input"
        :options="currencyOptions"
        outlined
        dense
        no-error-icon
        emit-value
        map-options
        class="currency-select"
        :disable="disable"
        hide-bottom-space
        @update:model-value="emit('update:currency', $event)"
      />
    </label>
  </div>

  <div
    v-if="shouldShowConversion"
    class="q-mb-md q-px-sm"
  >
    <div
      v-if="isConverting"
      class="text-caption text-grey-7"
    >
      <q-spinner
        size="12px"
        class="q-mr-xs"
      />
      Converting...
    </div>
    <div
      v-else-if="hasConversionError"
      class="text-caption text-negative"
    >
      <q-icon
        name="eva-alert-circle-outline"
        size="14px"
        class="q-mr-xs"
      />
      {{ conversionError }}
    </div>
    <div
      v-else-if="conversionResult"
      class="text-caption"
    >
      <q-icon
        name="eva-swap-outline"
        size="14px"
        class="q-mr-xs text-primary"
      />
      <span class="text-grey-7">Converted amount:</span>
      <span class="text-weight-bold q-ml-xs">{{ convertedAmountDisplay }}</span>
      <span class="text-grey-6 q-ml-xs"> (Rate: {{ conversionResult.rate.toFixed(4) }}) </span>
    </div>
  </div>
</template>

<script setup lang="ts">
type CurrencyOption = {
  label: string
  value: string
}

type ConversionResult = {
  convertedAmount: number
  rate: number
}

defineProps<{
  displayAmount: number | ''
  amountRules: ((val: number) => boolean | string)[]
  selectedCurrency: string
  currencyOptions: CurrencyOption[]
  disable: boolean
  shouldShowConversion: boolean
  isConverting: boolean
  hasConversionError: boolean
  conversionError: string
  conversionResult: ConversionResult | null
  convertedAmountDisplay: string
}>()

const emit = defineEmits<{
  (e: 'update:amount', value: number | string | null): void
  (e: 'update:currency', value: string): void
}>()
</script>

<style lang="scss" scoped>
.currency-select {
  min-width: 80px;

  :deep(.q-field__control) {
    height: 40px;
  }
}
</style>
