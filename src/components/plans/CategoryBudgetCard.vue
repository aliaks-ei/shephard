<template>
  <q-card
    :bordered="$q.dark.isActive"
    class="shadow-1 full-height"
  >
    <q-item
      class="column full-height q-pa-md"
      clickable
      @click="$emit('click', category)"
      style="position: relative"
    >
      <!-- Status Icon: Desktop - Top Right -->
      <q-icon
        v-if="$q.screen.gt.sm && statusIcon"
        :name="statusIcon.icon"
        :color="statusIcon.color"
        size="20px"
        class="absolute-top-right"
        style="top: 12px; right: 12px"
      >
        <q-tooltip>{{ statusTooltip }}</q-tooltip>
      </q-icon>

      <!-- Category Header -->
      <div class="row items-center full-width q-mb-md no-wrap">
        <q-item-section
          class="q-pr-sm"
          thumbnail
        >
          <CategoryIcon
            :color="category.categoryColor"
            :icon="category.categoryIcon"
            size="sm"
          />
        </q-item-section>
        <div class="column col-grow overflow-hidden">
          <div class="row items-center no-wrap">
            <strong class="text-weight-medium ellipsis">{{ category.categoryName }}</strong>
            <!-- Status Icon: Mobile - Next to Title -->
            <q-icon
              v-if="$q.screen.lt.md && statusIcon"
              :name="statusIcon.icon"
              :color="statusIcon.color"
              size="16px"
              class="q-ml-xs flex-shrink-0"
            />
          </div>
          <span class="text-caption text-grey-6 q-mt-none">
            {{ category.expenseCount }} {{ category.expenseCount === 1 ? 'expense' : 'expenses' }}
          </span>
        </div>
        <!-- Circular Progress: Top-right on mobile -->
        <q-circular-progress
          v-if="$q.screen.lt.md"
          show-value
          :value="Math.min(percentageUsed, 999)"
          :max="100"
          size="48px"
          :thickness="0.15"
          :color="progressColor"
          track-color="grey-4"
          class="q-ml-md flex-shrink-0"
        >
          <span class="text-caption text-weight-bold">{{ Math.round(percentageUsed) }}%</span>
        </q-circular-progress>
      </div>

      <!-- Metrics Section -->
      <q-item-section style="flex-grow: 0">
        <div class="row items-start">
          <!-- Circular Progress: Right side on desktop -->
          <q-circular-progress
            v-if="$q.screen.gt.sm"
            show-value
            :value="Math.min(percentageUsed, 999)"
            :max="100"
            size="52px"
            :thickness="0.17"
            :color="progressColor"
            track-color="grey-4"
            class="text-weight-bold q-mr-md"
          >
            <span class="text-caption text-weight-bold">{{ Math.round(percentageUsed) }}%</span>
          </q-circular-progress>

          <!-- Details Section -->
          <div class="col">
            <div class="row justify-between text-caption">
              <span class="text-grey-6">Spent</span>
              <span class="text-weight-bold">
                {{ formatCurrency(category.actualAmount, currency) }}
              </span>
            </div>

            <q-linear-progress
              :value="Math.min(percentageUsed / 100, 9.99)"
              :color="progressColor"
              size="4px"
              class="q-my-xs"
            />

            <div class="row justify-between text-caption">
              <span class="text-grey-6">Budget</span>
              <span>{{ formatCurrency(category.plannedAmount, currency) }}</span>
            </div>

            <div
              v-if="category.remainingAmount !== 0"
              class="row justify-between text-caption"
            >
              <span class="text-grey-6">{{
                category.remainingAmount > 0 ? 'Remaining' : 'Over'
              }}</span>
              <span
                class="text-weight-bold"
                :class="remainingAmountColor"
              >
                {{ formatCurrency(Math.abs(category.remainingAmount), currency) }}
              </span>
            </div>
          </div>
        </div>
      </q-item-section>
    </q-item>
  </q-card>
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

const progressColor = computed(() => getBudgetProgressColor(percentageUsed.value))
const remainingAmountColor = computed(() => getBudgetRemainingColorClass(percentageUsed.value))

const statusIcon = computed(() => {
  const percentage = percentageUsed.value

  // No icon when under or at budget
  if (percentage <= 100) return null

  // Warning icon when 101-110%
  if (percentage <= 110) {
    return {
      icon: 'eva-alert-triangle-outline',
      color: 'warning',
    }
  }

  // Over budget icon when > 110%
  return {
    icon: 'eva-alert-circle-outline',
    color: 'negative',
  }
})

const statusTooltip = computed(() => {
  const percentage = percentageUsed.value

  if (percentage <= 100) return ''
  if (percentage <= 110) return 'Budget Warning: Approaching limit'
  return 'Over Budget: Exceeded by more than 10%'
})
</script>
