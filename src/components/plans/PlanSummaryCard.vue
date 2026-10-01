<template>
  <q-card
    flat
    class="plan-summary"
  >
    <q-card-section :class="$q.screen.lt.md ? 'q-px-sm' : 'q-px-md'">
      <div class="row items-start justify-between no-wrap q-gutter-x-sm">
        <div class="col min-w-0">
          <h2 class="plan-summary__name q-my-none ellipsis">{{ plan?.name }}</h2>
          <div class="text-caption q-mt-xs">{{ dateCaption }}</div>
        </div>
        <StatusPill
          :label="statusPill.label"
          :icon="statusPill.icon"
          :tone="statusPill.tone"
          size="md"
        />
      </div>

      <!-- One money line: what is left, or how much over -->
      <div class="plan-summary__money q-mt-lg">
        <span
          class="plan-summary__amount text-amount"
          :class="{ 'text-over': remaining < 0 }"
        >
          {{ formatCurrency(Math.abs(animatedRemaining), currency) }}
        </span>
        <span class="plan-summary__amount-label">
          {{ remaining >= 0 ? 'left of' : 'over' }}
          <span class="text-amount">{{ formatCurrency(totalBudget, currency) }}</span>
        </span>
      </div>

      <div class="plan-summary__bar q-mt-md">
        <q-linear-progress
          :value="overallProgress"
          size="8px"
          class="progress-animated"
          :class="`plan-summary__progress--${statusPill.tone}`"
          :aria-label="`${Math.round(progressPercentage)}% of budget spent`"
        />
        <div
          v-if="pace"
          class="plan-summary__today"
          :style="{ left: `${pace.elapsedRatio * 100}%` }"
        />
      </div>

      <div class="row items-center justify-between text-caption q-mt-sm">
        <span>
          <span class="text-amount">{{ formatCurrency(animatedSpent, currency) }}</span> spent,
          {{ Math.round(progressPercentage) }}%
        </span>
        <span
          v-if="pace && remaining >= 0"
          class="text-amount"
        >
          {{ formatCurrency(pace.dailyAllowance, currency) }} a day
        </span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatusPill from 'src/components/shared/StatusPill.vue'
import { statusColorToTone, type StatusTone } from 'src/components/shared/status-tone'
import { useCountUp } from 'src/composables/useCountUp'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import {
  getStatusText,
  getStatusColor,
  getStatusIcon,
  getPlanPace,
  formatDateRange,
} from 'src/utils/plans'
import type { PlanWithItems } from 'src/api'

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  totalBudget: number
  totalSpent: number
  stillToPay: number
  currency: CurrencyCode
}>()

const remaining = computed(() => props.stillToPay)

const { displayValue: animatedSpent } = useCountUp(() => props.totalSpent)
const { displayValue: animatedRemaining } = useCountUp(remaining)

const progressPercentage = computed(() => {
  if (props.totalBudget === 0) return 0
  return (props.totalSpent / props.totalBudget) * 100
})

const overallProgress = computed(() => {
  if (props.totalBudget === 0) return 0
  return Math.min(props.totalSpent / props.totalBudget, 1)
})

const pace = computed(() =>
  props.plan ? getPlanPace(props.plan, props.totalBudget, props.totalSpent) : null,
)

const dateCaption = computed(() => {
  if (!props.plan) return ''
  const range = formatDateRange(props.plan.start_date, props.plan.end_date)
  return pace.value ? `${range}, ${getStatusText(props.plan)}` : range
})

const statusPill = computed((): { label: string; tone: StatusTone; icon?: string } => {
  if (!props.plan) return { label: 'Unknown', tone: 'muted', icon: 'eva-question-mark-outline' }
  if (remaining.value < 0) return { label: 'Over budget', tone: 'over' }
  if (pace.value?.status === 'ahead') return { label: 'Ahead of plan', tone: 'pace' }
  if (pace.value) return { label: 'On track', tone: 'success' }
  return {
    label: getStatusText(props.plan),
    tone: statusColorToTone(getStatusColor(props.plan)),
    icon: getStatusIcon(props.plan),
  }
})
</script>

<style scoped lang="scss">
.plan-summary__name {
  font-family: var(--font-display);
  font-size: 22px;
  line-height: 1.2;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.plan-summary__money {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 8px;
}

.plan-summary__amount {
  font-size: 34px;
  line-height: 1.1;
  font-weight: 650;
  letter-spacing: -0.03em;
  color: hsl(var(--ink));

  &.text-over {
    color: hsl(var(--over));
  }
}

.plan-summary__amount-label {
  color: hsl(var(--muted-foreground));
}

.plan-summary__bar {
  position: relative;
}

.plan-summary__progress--pace {
  color: hsl(var(--pace-bar));
}

.plan-summary__progress--over {
  color: hsl(var(--over));
}

// Where spend would be at an even pace
.plan-summary__today {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  background: hsl(var(--foreground) / 0.7);
}
</style>
