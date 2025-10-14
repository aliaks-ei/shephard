<template>
  <q-card flat>
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <h6 class="text-h6 q-my-none">{{ plan?.name }}</h6>
          <div class="text-caption text-grey-6">
            {{ formatDateRange(plan?.start_date || '', plan?.end_date || '') }}
          </div>
        </div>
        <q-chip
          :color="statusColor"
          text-color="white"
          :icon="statusIcon"
        >
          {{ statusText }}
        </q-chip>
      </div>

      <q-separator class="q-my-md" />

      <div
        class="row"
        :class="$q.screen.lt.md ? 'q-col-gutter-xs' : 'q-col-gutter-md'"
      >
        <div class="col">
          <div class="text-caption text-grey-6">Planned Budget</div>
          <div
            class="text-weight-bold"
            :class="$q.screen.lt.md ? 'text-subtitle2' : 'text-h6'"
          >
            {{ formatCurrency(totalBudget, currency) }}
          </div>
        </div>
        <div class="col">
          <div class="text-caption text-grey-6">Total Spent</div>
          <div
            class="text-weight-bold text-info"
            :class="$q.screen.lt.md ? 'text-subtitle2' : 'text-h6'"
          >
            {{ formatCurrency(totalSpent, currency) }}
          </div>
        </div>
        <div class="col">
          <div class="text-caption text-grey-6">{{ remaining >= 0 ? 'Still to pay' : 'Over' }}</div>
          <div
            class="text-weight-bold"
            :class="[remainingColorClass, $q.screen.lt.md ? 'text-subtitle2' : 'text-h6']"
          >
            {{ formatCurrency(Math.abs(remaining), currency) }}
          </div>
        </div>
      </div>

      <q-linear-progress
        :value="overallProgress"
        :color="progressColor"
        size="8px"
        class="q-mt-sm"
      />

      <div class="text-caption text-grey-6 q-mt-xs">
        {{ Math.round(progressPercentage) }}% of budget spent
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getStatusText, getStatusColor, getStatusIcon, formatDateRange } from 'src/utils/plans'
import { getBudgetProgressColor, getBudgetRemainingColorClass } from 'src/utils/budget'
import type { PlanWithItems } from 'src/api'

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  totalBudget: number
  totalSpent: number
  stillToPay: number
  currency: CurrencyCode
}>()

const remaining = computed(() => props.stillToPay)

const progressPercentage = computed(() => {
  if (props.totalBudget === 0) return 0
  return (props.totalSpent / props.totalBudget) * 100
})

const progressColor = computed(() => getBudgetProgressColor(progressPercentage.value))
const remainingColorClass = computed(() => getBudgetRemainingColorClass(progressPercentage.value))

const overallProgress = computed(() => {
  if (props.totalBudget === 0) return 0
  return Math.min(props.totalSpent / props.totalBudget, 1)
})

const statusText = computed(() => {
  if (!props.plan) return 'Unknown'
  return getStatusText(props.plan)
})

const statusColor = computed(() => {
  if (!props.plan) return 'grey'
  return getStatusColor(props.plan)
})

const statusIcon = computed(() => {
  if (!props.plan) return 'eva-question-mark-outline'
  return getStatusIcon(props.plan)
})
</script>
