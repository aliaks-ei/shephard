<template>
  <q-card class="shadow-1">
    <q-item
      class="column q-pa-md"
      clickable
      @click="$emit('click', category)"
    >
      <div class="row items-center">
        <q-item-section thumbnail>
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
        <div class="column">
          <strong class="text-weight-medium">{{ category.categoryName }}</strong>
          <span
            caption
            class="text-caption text-grey-6 q-mt-none"
          >
            {{ category.expenseCount }} {{ category.expenseCount === 1 ? 'expense' : 'expenses' }}
          </span>
        </div>
      </div>
      <q-item-section>
        <div class="row items-center justify-center q-my-md">
          <q-circular-progress
            show-value
            :value="percentageUsed"
            :max="100"
            :size="$q.screen.lt.md ? '72px' : '96px'"
            :thickness="0.2"
            :color="progressColor"
            track-color="grey-4"
            class="text-weight-bold"
          >
            <span class="text-subtitle2">{{ Math.round(percentageUsed) }}%</span>
          </q-circular-progress>
        </div>

        <div>
          <div class="row justify-between text-caption q-mb-xs">
            <span class="text-grey-6">Spent</span>
            <span class="text-weight-bold">
              {{ formatCurrency(category.actualAmount, currency) }}
            </span>
          </div>

          <q-linear-progress
            :value="percentageUsed / 100"
            :color="progressColor"
            size="4px"
            class="q-my-xs"
          />

          <div class="row justify-between text-caption q-mt-xs">
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
              :class="category.remainingAmount >= 0 ? 'text-positive' : 'text-negative'"
            >
              {{ formatCurrency(Math.abs(category.remainingAmount), currency) }}
            </span>
          </div>
        </div>
      </q-item-section>
      <q-item-section side>
        <q-badge
          v-if="isOverBudget"
          color="negative"
          label="Over Budget"
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
  return Math.min((props.category.actualAmount / props.category.plannedAmount) * 100, 999)
})

const isOverBudget = computed(() => props.category.remainingAmount < 0)

const progressColor = computed(() => {
  const percentage = percentageUsed.value
  if (percentage > 100) return 'negative'
  if (percentage > 90) return 'warning'
  if (percentage > 70) return 'orange'
  return 'primary'
})
</script>
