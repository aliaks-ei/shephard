<template>
  <q-card
    class="budget-hero-card"
    :class="{ 'cursor-pointer': !hasLoadError }"
    :role="hasLoadError ? undefined : 'button'"
    :tabindex="hasLoadError ? -1 : 0"
    :aria-label="hasLoadError ? undefined : `Open plan ${plan.name}`"
    @click="openPlan"
    @keyup.enter="openPlan"
    @keyup.space.prevent="openPlan"
  >
    <q-card-section class="budget-hero-card__section">
      <!-- Loading state -->
      <template v-if="isOverviewLoading">
        <div class="row items-center justify-between q-mb-md">
          <q-skeleton
            type="text"
            width="40%"
            dark
          />
          <q-skeleton
            type="QChip"
            width="80px"
            dark
          />
        </div>
        <q-skeleton
          type="text"
          width="55%"
          height="48px"
          dark
        />
        <q-skeleton
          type="rect"
          height="8px"
          class="q-mt-md"
          dark
        />
        <q-skeleton
          type="text"
          width="50%"
          class="q-mt-xs"
          dark
        />
      </template>

      <div
        v-else-if="hasLoadError"
        @click.stop
      >
        <QueryErrorState
          compact
          entity-name="Budget overview"
          :retrying="isRetrying ?? false"
          @retry="retry"
        />
      </div>

      <!-- Loaded state -->
      <template v-else>
        <div class="row items-center justify-between no-wrap q-mb-md">
          <div class="budget-hero-card__plan-name ellipsis col">
            {{ plan.name }}
          </div>
          <span class="budget-hero-card__days">{{ getStatusText(plan) }}</span>
        </div>

        <div class="text-display budget-hero-card__amount">
          {{ heroAmountParts.major
          }}<span
            v-if="heroAmountParts.minor"
            class="text-display__minor"
            >{{ heroAmountParts.minor }}</span
          >
        </div>
        <div class="budget-hero-card__caption q-mt-xs">
          {{ amountCaption }}
        </div>

        <div
          class="budget-hero-card__bar q-mt-md"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(progressPercentage)"
          :aria-label="`${Math.round(progressPercentage)}% of budget spent`"
        >
          <div
            class="budget-hero-card__bar-fill"
            :class="`budget-hero-card__bar-fill--${paceStatus}`"
            :style="{ width: `${overallProgress * 100}%` }"
          />
          <div
            v-if="pace"
            class="budget-hero-card__bar-today"
            :style="{ left: `${pace.elapsedRatio * 100}%` }"
          />
        </div>

        <div
          v-if="pace"
          class="row items-center justify-between no-wrap q-mt-md"
        >
          <span
            class="budget-hero-card__pace-chip"
            :class="`budget-hero-card__pace-chip--${paceStatus}`"
          >
            {{ paceLabel }}
          </span>
          <span
            v-if="paceStatus !== 'over'"
            class="budget-hero-card__daily text-amount"
          >
            {{ formatAmount(pace.dailyAllowance) }} a day
          </span>
        </div>
        <div
          v-else
          class="budget-hero-card__caption q-mt-sm"
        >
          {{ Math.round(progressPercentage) }}% spent
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePreferencesStore } from 'src/stores/preferences'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import { useCountUp } from 'src/composables/useCountUp'
import { getStatusText, getPlanPace, type PlanPaceStatus } from 'src/utils/plans'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import type { PlanWithPermission } from 'src/api'
import type { DashboardPlanOverview } from 'src/composables/useDashboardOverview'

const emit = defineEmits<{
  click: [planId: string]
  retry: []
}>()

const props = defineProps<{
  plan: PlanWithPermission
  overview: DashboardPlanOverview | null
  isOverviewLoading?: boolean
  hasLoadError?: boolean
  isRetrying?: boolean
}>()

const preferencesStore = usePreferencesStore()

const PACE_LABELS: Record<PlanPaceStatus, string> = {
  'on-track': 'On track',
  ahead: 'Ahead of plan',
  over: 'Over budget',
}

const totalBudget = computed(() => props.overview?.totalBudget ?? props.plan.total ?? 0)
const totalSpent = computed(() => props.overview?.totalSpent ?? 0)
const remainingBudget = computed(() => props.overview?.remainingBudget ?? totalBudget.value)

const isOverBudget = computed(() => remainingBudget.value < 0)

const pace = computed(() => getPlanPace(props.plan, totalBudget.value, totalSpent.value))
const paceStatus = computed<PlanPaceStatus>(() =>
  isOverBudget.value ? 'over' : (pace.value?.status ?? 'on-track'),
)
const paceLabel = computed(() => PACE_LABELS[paceStatus.value])

const amountCaption = computed(() =>
  isOverBudget.value
    ? `over the ${formatAmount(totalBudget.value)} budget`
    : `left of ${formatAmount(totalBudget.value)}`,
)

const progressPercentage = computed(() => {
  if (totalBudget.value === 0) return 0
  return (totalSpent.value / totalBudget.value) * 100
})

const overallProgress = computed(() => {
  if (totalBudget.value === 0) return 0
  return Math.min(totalSpent.value / totalBudget.value, 1)
})

const { displayValue: animatedRemaining } = useCountUp(remainingBudget, {
  enabled: () => !preferencesStore.isPrivacyModeEnabled,
})

// "€708,10" -> "€708" + ",10", so the cents can sit smaller than the units
const heroAmountParts = computed(() => {
  const formatted = formatAmount(Math.abs(animatedRemaining.value))
  const match = /^(.*)([.,]\d{2})$/.exec(formatted)
  return match ? { major: match[1], minor: match[2] } : { major: formatted, minor: '' }
})

function openPlan(): void {
  if (!props.hasLoadError) {
    emit('click', props.plan.id)
  }
}

function retry(): void {
  emit('retry')
}

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}
</script>

<style lang="scss" scoped>
.budget-hero-card {
  border-radius: var(--radius-hero);
  border: none;
  color: hsl(var(--hero-foreground));
  background:
    radial-gradient(90% 120% at 100% 0%, hsl(var(--hero-glow)) 0%, transparent 60%),
    hsl(var(--hero-bg));
  box-shadow: var(--shadow-md);
}

.budget-hero-card__section {
  padding: 20px;
}

.budget-hero-card:focus-visible {
  outline: none;
  box-shadow:
    var(--shadow-md),
    0 0 0 3px hsl(var(--ring) / 0.5);
}

.budget-hero-card__plan-name {
  color: hsl(var(--hero-muted));
  font-weight: 500;
}

.budget-hero-card__days {
  flex: 0 0 auto;
  margin-left: 8px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: hsl(var(--hero-track));
  color: hsl(var(--hero-foreground));
  font-size: 12px;
  font-weight: 500;
}

.budget-hero-card__amount {
  color: hsl(var(--hero-foreground));
}

.budget-hero-card__caption {
  color: hsl(var(--hero-muted));
  font-size: 14px;
}

.budget-hero-card__bar {
  position: relative;
  height: 8px;
  border-radius: var(--radius-full);
  background: hsl(var(--hero-track));
}

.budget-hero-card__bar-fill {
  max-width: 100%;
  height: 100%;
  border-radius: inherit;
  background: hsl(var(--hero-fill));
  transform-origin: 0 50%;
  animation: progress-grow 700ms var(--ease-out-quint) both;

  &--ahead {
    background: hsl(var(--pace));
  }

  &--over {
    background: hsl(var(--over));
  }
}

// "Today" marker: where spend would be at an even pace
.budget-hero-card__bar-today {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  background: hsl(var(--hero-marker));
}

.budget-hero-card__pace-chip {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  background: hsl(var(--hero-track));
  color: hsl(var(--hero-foreground));

  &--ahead {
    background: hsl(var(--pace-soft-bg));
    color: hsl(var(--pace));
  }

  &--over {
    background: hsl(var(--over) / 0.28);
    color: hsl(355 100% 86%);
  }
}

.budget-hero-card__daily {
  color: hsl(var(--hero-foreground));
  font-size: 15px;
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .budget-hero-card__bar-fill {
    animation: none;
  }
}
</style>
