<template>
  <q-item
    clickable
    class="category-budget-row q-px-md q-py-sm"
    @click="$emit('click', category)"
  >
    <q-item-section
      avatar
      class="q-pr-md min-w-auto"
    >
      <CategoryIcon
        :color="category.categoryColor"
        :icon="category.categoryIcon"
        size="sm"
      />
    </q-item-section>

    <q-item-section class="overflow-hidden">
      <div class="row justify-between items-baseline no-wrap">
        <span class="text-weight-medium ellipsis">{{ category.categoryName }}</span>
        <span
          class="category-budget-row__status text-amount q-pl-sm"
          :class="`category-budget-row__status--${state}`"
        >
          <template v-if="state === 'over'"
            >{{ formatCurrency(overAmount, currency) }} over</template
          >
          <template v-else-if="state === 'used'">All used</template>
          <template v-else>
            {{ formatCurrency(category.remainingAmount, currency) }}
            <span class="category-budget-row__unit">left</span>
          </template>
        </span>
      </div>

      <div class="text-caption q-mt-xs">
        <span class="text-amount">{{ formatCurrency(category.actualAmount, currency) }}</span>
        of
        <span class="text-amount">{{ formatCurrency(category.plannedAmount, currency) }}</span>
      </div>

      <!-- Category colour up to the budget, then a red tail for the overspend -->
      <div
        class="category-budget-row__bar q-mt-sm"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="roundedPercentage"
        :aria-label="`${category.categoryName}: ${roundedPercentage}% of budget used`"
      >
        <div
          class="category-budget-row__fill category-tone-fg"
          :style="[toneStyle, { width: `${budgetShare}%` }]"
        />
        <div
          v-if="state === 'over'"
          class="category-budget-row__overflow"
          :style="{ width: `${100 - budgetShare}%` }"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getCategoryToneStyle } from 'src/utils/categories'
import type { CategoryBudget } from 'src/types'

const props = defineProps<{
  category: CategoryBudget
  currency: CurrencyCode
}>()

defineEmits<{
  (e: 'click', category: CategoryBudget): void
}>()

const toneStyle = computed(() => getCategoryToneStyle(props.category.categoryColor))

const percentageUsed = computed(() => {
  if (props.category.plannedAmount === 0) return props.category.actualAmount > 0 ? 999 : 0
  return (props.category.actualAmount / props.category.plannedAmount) * 100
})

const roundedPercentage = computed(() => Math.round(Math.min(percentageUsed.value, 999)))

// Over is spent vs planned: remainingAmount counts only unpaid fixed items, so it can be 0
// while spend is past the budget.
const overAmount = computed(() =>
  Math.max(props.category.actualAmount - props.category.plannedAmount, 0),
)

const state = computed<'left' | 'used' | 'over'>(() => {
  if (overAmount.value > 0.005) return 'over'
  if (props.category.remainingAmount <= 0 && props.category.plannedAmount > 0) return 'used'
  return 'left'
})

// Over budget: the bar spans the actual spend, the budget part is a share of it
const budgetShare = computed(() => {
  const { plannedAmount, actualAmount } = props.category
  if (state.value === 'over') return actualAmount > 0 ? (plannedAmount / actualAmount) * 100 : 0
  return Math.min(percentageUsed.value, 100)
})
</script>

<style lang="scss" scoped>
.category-budget-row__status {
  flex: 0 0 auto;
  font-weight: 600;
  color: hsl(var(--ink));

  &--used {
    color: hsl(var(--muted-foreground));
  }

  &--over {
    color: hsl(var(--over));
  }
}

.category-budget-row__unit {
  font-family: inherit;
  font-weight: 400;
  color: hsl(var(--muted-foreground));
}

.category-budget-row__bar {
  display: flex;
  gap: 2px;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: hsl(var(--muted-foreground) / 0.14);
}

.category-budget-row__fill,
.category-budget-row__overflow {
  height: 100%;
  transform-origin: 0 50%;
  animation: progress-grow 700ms var(--ease-out-quint) both;
}

.category-budget-row__fill {
  background: currentColor;
}

.category-budget-row__overflow {
  background: hsl(var(--over));
}

@media (prefers-reduced-motion: reduce) {
  .category-budget-row__fill,
  .category-budget-row__overflow {
    animation: none;
  }
}
</style>
