<template>
  <!-- The amount leads the form: large, centred, decimal keyboard -->
  <div class="expense-amount column items-center q-mb-md">
    <label
      for="expense-amount-input"
      class="sr-only"
    >
      Amount
    </label>
    <q-input
      for="expense-amount-input"
      :model-value="displayAmount"
      placeholder="0,00"
      type="text"
      borderless
      no-error-icon
      inputmode="decimal"
      autocomplete="off"
      :autofocus="autofocus"
      :rules="amountRules"
      :disable="disable"
      class="expense-amount__input full-width"
      input-class="expense-amount__native text-amount text-center"
      @update:model-value="emit('update:amount', $event)"
    />

    <q-select
      id="expense-currency-input"
      :model-value="selectedCurrency"
      :options="currencyOptions"
      borderless
      dense
      no-error-icon
      emit-value
      options-dense
      map-options
      aria-label="Currency"
      class="expense-amount__currency"
      :disable="disable"
      hide-bottom-space
      @update:model-value="emit('update:currency', $event)"
    />
  </div>

  <div
    v-if="shouldShowConversion"
    class="q-mb-md q-px-sm"
  >
    <div
      v-if="isConverting"
      class="text-caption"
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
      <span class="text-muted">Converted amount:</span>
      <span class="text-weight-bold q-ml-xs text-amount">{{ convertedAmountDisplay }}</span>
      <span class="text-muted q-ml-xs"> (Rate: {{ conversionResult.rate.toFixed(4) }}) </span>
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
  autofocus?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:amount', value: number | string | null): void
  (e: 'update:currency', value: string): void
}>()
</script>

<style lang="scss" scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.expense-amount__input {
  :deep(.q-field__control) {
    height: 64px;
    background: transparent;
    box-shadow: none;
  }

  :deep(.q-field__bottom) {
    justify-content: center;
    text-align: center;
  }
}

// iOS zooms inputs under 16px; this one is far larger
.expense-amount__input :deep(.expense-amount__native) {
  font-size: 46px !important;
  line-height: 1.1;
  font-weight: 650;
  letter-spacing: -0.03em;
  color: hsl(var(--ink));

  &::placeholder {
    color: hsl(var(--muted-foreground) / 0.5);
  }
}

// Currency as a small chip under the amount
.expense-amount__currency {
  :deep(.q-field__control) {
    min-height: 32px;
    height: 32px;
    padding: 0 6px 0 12px;
    border-radius: var(--radius-full);
    background: hsl(var(--muted));
    box-shadow: none;
  }

  :deep(.q-field__native) {
    min-height: 32px;
    padding: 0;
    font-size: 13px !important;
    font-weight: 600;
  }

  :deep(.q-field__append) {
    height: 32px;
  }
}
</style>
