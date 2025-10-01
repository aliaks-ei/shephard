<template>
  <q-card class="shadow-1 full-height">
    <q-item
      class="column q-pa-md"
      clickable
      @click="$emit('click', category)"
    >
      <!-- Category Header -->
      <div class="row items-center full-width q-mb-md no-wrap">
        <q-item-section
          class="q-pr-sm q-mr-xs"
          thumbnail
        >
          <q-avatar
            :style="{ backgroundColor: category.categoryColor }"
            size="32px"
            text-color="white"
          >
            <q-icon
              :name="category.categoryIcon"
              size="16px"
            />
          </q-avatar>
        </q-item-section>
        <div class="column col-grow overflow-hidden">
          <strong class="text-weight-medium ellipsis">{{ category.categoryName }}</strong>
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
      <q-item-section>
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

      <!-- Status Badge -->
      <q-item-section
        v-if="statusBadge"
        side
      >
        <q-badge
          :color="statusBadge.color"
          :label="statusBadge.label"
        />
      </q-item-section>
    </q-item>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'

interface CategoryBudget {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  plannedAmount: number
  actualAmount: number
  remainingAmount: number
  expenseCount: number
}

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

// Color logic: Primary (< 100%), Green (100%), Warning (101-110%), Negative (> 110%)
const progressColor = computed(() => {
  const percentage = percentageUsed.value
  if (percentage < 100) return 'primary'
  if (percentage === 100) return 'positive'
  if (percentage <= 110) return 'warning'
  return 'negative'
})

const remainingAmountColor = computed(() => {
  const percentage = percentageUsed.value
  if (percentage < 100) return 'text-primary'
  if (percentage === 100) return 'text-positive'
  if (percentage <= 110) return 'text-warning'
  return 'text-negative'
})

const statusBadge = computed(() => {
  const percentage = percentageUsed.value

  // No badge when under or at budget
  if (percentage <= 100) return null

  // Warning badge when 101-110%
  if (percentage <= 110) {
    return {
      color: 'warning',
      label: 'Warning',
    }
  }

  // Over budget badge when > 110%
  return {
    color: 'negative',
    label: 'Over Budget',
  }
})
</script>
