<template>
  <!-- One line answers "what does this do to my budget?" -->
  <div
    v-if="categoryOption && amount && amount > 0 && currency"
    class="budget-impact"
    :class="{ 'budget-impact--over': newRemainingAmount < 0 }"
    role="status"
  >
    <div
      class="budget-impact__bar"
      aria-hidden="true"
    >
      <div
        class="budget-impact__fill category-tone-fg"
        :style="[toneStyle, { width: `${spentShare}%` }]"
      />
      <div
        class="budget-impact__added"
        :style="{ width: `${addedShare}%` }"
      />
    </div>
    <div class="budget-impact__text q-mt-sm">
      <span class="text-amount text-weight-bold budget-impact__amount">
        {{ formatCurrency(Math.abs(newRemainingAmount), currency) }}
      </span>
      {{ newRemainingAmount >= 0 ? 'left' : 'over' }} in {{ categoryOption.label }} after this
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getCategoryToneStyle } from 'src/utils/categories'

interface CategoryOption {
  label: string
  value: string
  color: string
  icon: string
  plannedAmount: number
  actualAmount: number
  remainingAmount: number
}

interface Props {
  categoryId: string | null
  amount: number | null
  currency: CurrencyCode | null
  categoryOption: CategoryOption | null
}

const props = defineProps<Props>()

const toneStyle = computed(() => getCategoryToneStyle(props.categoryOption?.color))

const newSpentAmount = computed(() => {
  if (!props.categoryOption || !props.amount) return 0
  return props.categoryOption.actualAmount + props.amount
})

const newRemainingAmount = computed(() => {
  if (!props.categoryOption) return 0
  return props.categoryOption.plannedAmount - newSpentAmount.value
})

// The bar spans the budget, or the new total when this expense goes over it
const scale = computed(() =>
  Math.max(props.categoryOption?.plannedAmount ?? 0, newSpentAmount.value, 1),
)
const spentShare = computed(() => ((props.categoryOption?.actualAmount ?? 0) / scale.value) * 100)
const addedShare = computed(() => ((props.amount ?? 0) / scale.value) * 100)
</script>

<style lang="scss" scoped>
.budget-impact__bar {
  display: flex;
  gap: 2px;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: hsl(var(--muted-foreground) / 0.14);
}

.budget-impact__fill {
  height: 100%;
  background: currentColor;
}

// The new expense: brand teal, or red when it takes the category over budget
.budget-impact__added {
  height: 100%;
  background: hsl(var(--primary));
  transition: width var(--duration-base) var(--ease-out-quint);
}

.budget-impact--over .budget-impact__added {
  background: hsl(var(--over));
}

.budget-impact__text {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.budget-impact__amount {
  color: hsl(var(--ink));
}

.budget-impact--over .budget-impact__amount {
  color: hsl(var(--over));
}
</style>
