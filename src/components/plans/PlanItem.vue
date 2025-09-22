<template>
  <q-item class="q-py-sm q-px-none">
    <q-item-section>
      <q-input
        :model-value="modelValue.name"
        :readonly="readonly"
        :rules="nameRules"
        :dense="$q.screen.lt.md"
        class="q-px-none"
        label="Item name"
        no-error-icon
        outlined
        item-aligned
        @update:model-value="updateName"
      />
    </q-item-section>

    <q-item-section :style="$q.screen.lt.md ? 'max-width: 80px' : 'max-width: 112px'">
      <q-input
        :model-value="modelValue.amount || undefined"
        :readonly="readonly"
        :rules="amountRules"
        :dense="$q.screen.lt.md"
        :prefix="currencySymbol"
        type="number"
        min="0"
        step="1"
        label="Amount"
        class="q-px-none"
        outlined
        item-aligned
        no-error-icon
        @update:model-value="updateAmount"
      />
    </q-item-section>

    <q-item-section
      v-if="!readonly"
      side
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
import { computed } from 'vue'
import { getCurrencySymbol, type CurrencyCode } from 'src/utils/currency'
import type { PlanItemUI } from 'src/types'

const emit = defineEmits<{
  (e: 'update:modelValue', item: PlanItemUI): void
  (e: 'remove'): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: PlanItemUI
    currency: CurrencyCode
    readonly?: boolean
  }>(),
  {
    readonly: false,
  },
)

const currencySymbol = computed(() => getCurrencySymbol(props.currency))
const nameRules = computed(() =>
  props.readonly
    ? []
    : [(val: string | null | undefined) => !!val?.trim() || 'Item name is required'],
)
const amountRules = computed(() =>
  props.readonly
    ? []
    : [
        (val: number | null | undefined) =>
          (val !== null && val !== undefined) || 'Amount is required',
        (val: number | null | undefined) => (val && val > 0) || 'Amount must be greater than 0',
      ],
)

function updateName(name: string | number | null): void {
  if (props.readonly || typeof name !== 'string') return

  const updatedItem: PlanItemUI = {
    ...props.modelValue,
    name,
  }

  emit('update:modelValue', updatedItem)
}

function updateAmount(amount: string | number | null): void {
  if (props.readonly) return

  const numericAmount =
    amount === null || amount === undefined || amount === '' ? 0 : Number(amount)
  const updatedItem: PlanItemUI = {
    ...props.modelValue,
    amount: numericAmount,
  }
  emit('update:modelValue', updatedItem)
}
</script>
