<template>
  <q-item
    clickable
    class="q-px-md q-py-sm"
    @click="$emit('click', category)"
  >
    <q-item-section
      avatar
      class="q-pr-md"
      style="min-width: auto"
    >
      <CategoryIcon
        :color="category.categoryColor"
        :icon="category.categoryIcon"
        size="sm"
      />
    </q-item-section>

    <q-item-section class="overflow-hidden">
      <!-- Top row: Name and Remaining -->
      <div class="row justify-between items-center q-mb-xs no-wrap">
        <div class="row items-center no-wrap ellipsis">
          <span class="text-weight-medium text-body2 ellipsis">{{ category.categoryName }}</span>
          <q-badge
            v-if="statusBadge"
            :color="statusBadge.color"
            text-color="white"
            class="q-ml-xs"
          >
            {{ statusBadge.label }}
          </q-badge>
        </div>
        <div class="text-right q-pl-sm flex-shrink-0">
          <span
            class="text-weight-bold text-body2"
            :class="remainingAmountColor"
          >
            {{ formatCurrency(Math.abs(category.remainingAmount), currency) }}
          </span>
          <span class="text-caption text-grey-6 q-ml-xs">
            {{ category.remainingAmount >= 0 ? 'left' : 'over' }}
          </span>
        </div>
      </div>

      <!-- Middle row: Spent of Planned & Percentage -->
      <div class="row justify-between items-center text-caption q-mb-xs">
        <div class="ellipsis">
          <span class="text-weight-medium">{{
            formatCurrency(category.actualAmount, currency)
          }}</span>
          <span class="text-grey-6 q-mx-xs">of</span>
          <span class="text-grey-6">{{ formatCurrency(category.plannedAmount, currency) }}</span>
        </div>
        <div class="text-weight-medium text-grey-6 flex-shrink-0 q-pl-sm">
          {{ roundedPercentage }}%
        </div>
      </div>

      <!-- Bottom row: Progress bar -->
      <q-linear-progress
        :value="progressValue"
        :color="progressColor"
        size="sm"
        rounded
        :track-color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getBudgetProgressColor, getBudgetRemainingColorClass } from 'src/utils/budget'
import type { CategoryBudget } from 'src/types'

const props = defineProps<{
  category: CategoryBudget
  currency: CurrencyCode
}>()

defineEmits<{
  (e: 'click', category: CategoryBudget): void
}>()

const percentageUsed = computed(() => {
  if (props.category.plannedAmount === 0) return 0
  return (props.category.actualAmount / props.category.plannedAmount) * 100
})

const roundedPercentage = computed(() => Math.round(Math.min(percentageUsed.value, 999)))

const progressValue = computed(() => {
  if (percentageUsed.value <= 0) return 0
  return Math.min(percentageUsed.value / 100, 1)
})

const progressColor = computed(() => getBudgetProgressColor(percentageUsed.value))
const remainingAmountColor = computed(() => getBudgetRemainingColorClass(percentageUsed.value))

const statusBadge = computed<null | { label: string; color: string }>(() => {
  if (percentageUsed.value > 100) {
    return { label: 'Over', color: 'negative' }
  }

  if (percentageUsed.value === 100) {
    return { label: 'Done', color: 'positive' }
  }

  if (percentageUsed.value >= 90) {
    return { label: 'Near', color: 'warning' }
  }

  return null
})
</script>
