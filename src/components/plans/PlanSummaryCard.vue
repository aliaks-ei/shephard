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

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <div class="text-caption text-grey-6">Total Budget</div>
          <div class="text-h6 text-weight-bold">
            {{ formatCurrency(totalBudget, currency) }}
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="text-caption text-grey-6">Total Spent</div>
          <div class="text-h6 text-weight-bold text-primary">
            {{ formatCurrency(totalSpent, currency) }}
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="text-caption text-grey-6">Remaining</div>
          <div
            class="text-h6 text-weight-bold"
            :class="remainingColorClass"
          >
            {{ formatCurrency(remaining, currency) }}
          </div>
        </div>
      </div>

      <q-linear-progress
        :value="overallProgress"
        :color="progressColor"
        size="8px"
        class="q-mt-md"
      />

      <div class="text-caption text-grey-6 q-mt-xs">
        {{ Math.round(overallProgress * 100) }}% of budget spent
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getStatusText, getStatusColor, getStatusIcon, formatDateRange } from 'src/utils/plans'
import type { PlanWithItems } from 'src/api'

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  totalBudget: number
  totalSpent: number
  currency: CurrencyCode
}>()

// Computed properties
const remaining = computed(() => props.totalBudget - props.totalSpent)

const overallProgress = computed(() => {
  if (props.totalBudget === 0) return 0
  return Math.min(props.totalSpent / props.totalBudget, 1)
})

const progressColor = computed(() => {
  const percentage = overallProgress.value * 100
  if (percentage > 100) return 'negative'
  if (percentage > 90) return 'warning'
  if (percentage > 70) return 'orange'
  return 'primary'
})

const remainingColorClass = computed(() => {
  if (remaining.value < 0) return 'text-negative'
  if (remaining.value < props.totalBudget * 0.1) return 'text-warning'
  return 'text-positive'
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
