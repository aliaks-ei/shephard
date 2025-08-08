<template>
  <q-item class="q-py-sm q-px-none">
    <q-item-section>
      <q-input
        :model-value="modelValue.name"
        :readonly="readonly"
        :rules="nameRules"
        class="q-px-none"
        label="Item name"
        outlined
        item-aligned
        @update:model-value="updateName"
      />
    </q-item-section>

    <q-item-section style="max-width: 150px">
      <q-input
        :model-value="modelValue.amount"
        :readonly="readonly"
        :rules="amountRules"
        :prefix="currencySymbol"
        type="number"
        min="0"
        step="1"
        label="Amount"
        class="q-px-none"
        outlined
        item-aligned
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
        dense
        icon="eva-trash-2-outline"
        color="negative"
        @click="emit('remove')"
      >
        <q-tooltip>Remove item</q-tooltip>
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

  const updatedItem: PlanItemUI = {
    ...props.modelValue,
    amount: Number(amount) || 0,
  }
  emit('update:modelValue', updatedItem)
}
</script>
