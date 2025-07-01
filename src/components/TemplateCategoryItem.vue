<template>
  <q-item class="q-py-sm">
    <q-item-section>
      <q-input
        class="q-px-none"
        :model-value="modelValue.name"
        label="Item name"
        outlined
        item-aligned
        :readonly="readonly"
        :rules="readonly ? [] : [(val) => !!val?.trim() || 'Item name is required']"
        @update:model-value="updateName"
      />
    </q-item-section>

    <q-item-section style="max-width: 140px">
      <q-input
        :model-value="modelValue.amount"
        type="number"
        min="0"
        step="1"
        :prefix="currencySymbol"
        label="Amount"
        class="q-px-none"
        outlined
        item-aligned
        :readonly="readonly"
        :rules="
          readonly
            ? []
            : [
                (val) => (val !== null && val !== undefined) || 'Amount is required',
                (val) => val > 0 || 'Amount must be greater than 0',
              ]
        "
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
import { getCurrencySymbol, type CurrencyCode } from 'src/utils/currency'
import type { TemplateCategoryItem } from 'src/api'

const emit = defineEmits<{
  (e: 'update:modelValue', item: TemplateCategoryItem): void
  (e: 'remove'): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: TemplateCategoryItem
    currency: CurrencyCode
    readonly?: boolean
  }>(),
  {
    readonly: false,
  },
)

const currencySymbol = getCurrencySymbol(props.currency)

function updateName(name: string | number | null): void {
  if (props.readonly || typeof name !== 'string') return

  const updatedItem: TemplateCategoryItem = {
    ...props.modelValue,
    name,
  }
  emit('update:modelValue', updatedItem)
}

function updateAmount(amount: string | number | null): void {
  if (props.readonly) return

  const updatedItem: TemplateCategoryItem = {
    ...props.modelValue,
    amount: Number(amount) || 0,
  }
  emit('update:modelValue', updatedItem)
}
</script>
