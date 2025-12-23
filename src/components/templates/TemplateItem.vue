<template>
  <q-item class="q-pb-xs q-pt-sm q-px-none">
    <q-item-section>
      <q-input
        ref="nameInputRef"
        :model-value="modelValue.name"
        :readonly="readonly"
        :rules="nameRules"
        placeholder="Item name"
        dense
        class="q-px-none"
        no-error-icon
        outlined
        item-aligned
        inputmode="text"
        @update:model-value="updateName"
      />
    </q-item-section>

    <q-item-section :style="$q.screen.lt.md ? 'max-width: 80px' : 'max-width: 112px'">
      <q-input
        :model-value="displayAmount"
        :readonly="readonly"
        :rules="amountRules"
        :prefix="currencySymbol"
        placeholder="Amount"
        dense
        type="text"
        class="q-px-none"
        outlined
        item-aligned
        no-error-icon
        inputmode="decimal"
        @update:model-value="updateAmount"
      />
    </q-item-section>

    <q-item-section style="flex: 0 0 auto">
      <q-checkbox
        :model-value="modelValue.isFixedPayment"
        :readonly="readonly"
        :disable="readonly"
        dense
        label="Fixed"
        @update:model-value="updateIsFixedPayment"
      >
        <q-tooltip v-if="!readonly">
          Mark as fixed payment if this must be paid every period
        </q-tooltip>
      </q-checkbox>
    </q-item-section>

    <q-item-section
      v-if="!readonly"
      style="flex: 0 0 auto"
    >
      <q-btn
        flat
        round
        :size="$q.screen.lt.md ? 'sm' : 'md'"
        dense
        icon="eva-trash-2-outline"
        color="negative"
        @click="emit('remove')"
      >
        <q-tooltip v-if="!$q.screen.lt.md">Remove item</q-tooltip>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QInput } from 'quasar'
import { getCurrencySymbol, type CurrencyCode } from 'src/utils/currency'
import { parseDecimalInput } from 'src/utils/decimal'
import type { TemplateItemUI } from 'src/types'

const nameInputRef = ref<QInput | null>(null)

const emit = defineEmits<{
  (e: 'update:modelValue', item: TemplateItemUI): void
  (e: 'remove'): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: TemplateItemUI
    currency: CurrencyCode
    readonly?: boolean
  }>(),
  {
    readonly: false,
  },
)

const currencySymbol = computed(() => getCurrencySymbol(props.currency))
const displayAmount = computed(() => (props.modelValue.amount ? props.modelValue.amount : ''))

const nameRules = computed(() =>
  props.readonly
    ? []
    : [(val: string | null | undefined) => !!val?.trim() || 'Item name is required'],
)
const amountRules = computed(() =>
  props.readonly
    ? []
    : [
        (val: string | number | null | undefined) => {
          const parsed = parseDecimalInput(val)
          return parsed !== null || 'Amount is required'
        },
        (val: string | number | null | undefined) => {
          const parsed = parseDecimalInput(val)
          return (parsed && parsed > 0) || 'Amount must be greater than 0'
        },
      ],
)

function updateName(name: string | number | null): void {
  if (props.readonly || typeof name !== 'string') return

  const updatedItem: TemplateItemUI = {
    ...props.modelValue,
    name,
  }

  emit('update:modelValue', updatedItem)
}

function updateAmount(amount: string | number | null): void {
  if (props.readonly) return

  const numericAmount = parseDecimalInput(amount) ?? 0
  const updatedItem: TemplateItemUI = {
    ...props.modelValue,
    amount: numericAmount,
  }
  emit('update:modelValue', updatedItem)
}

function updateIsFixedPayment(value: boolean): void {
  if (props.readonly) return

  const updatedItem: TemplateItemUI = {
    ...props.modelValue,
    isFixedPayment: value,
  }

  emit('update:modelValue', updatedItem)
}

function focusNameInput(): void {
  nameInputRef.value?.focus()
}

defineExpose({
  focusNameInput,
})
</script>
