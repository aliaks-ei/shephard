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
    <q-card-section>
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
        <!-- Row 1: Plan name + status chip -->
        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="budget-hero-card__plan-name ellipsis col">
            {{ plan.name }}
          </div>
          <q-chip
            class="budget-hero-card__chip"
            size="sm"
            square
          >
            {{ getStatusText(plan) }}
          </q-chip>
        </div>

        <!-- Row 2: Hero metric -->
        <div class="budget-hero-card__overline section-overline">
          {{ isOverBudget ? 'Over budget' : 'Left to spend' }}
        </div>
        <div class="text-display budget-hero-card__amount">
          <q-icon
            v-if="isOverBudget"
            name="eva-alert-triangle-outline"
            size="28px"
            class="q-mr-xs"
          />
          {{ heroAmount }}
        </div>

        <!-- Row 3: Progress -->
        <q-linear-progress
          :value="overallProgress"
          :aria-label="`${Math.round(progressPercentage)}% of budget spent`"
          class="budget-hero-card__progress q-mt-md"
          size="8px"
        />

        <!-- Row 4: Caption with percentage + days remaining -->
        <div class="budget-hero-card__caption text-caption q-mt-xs">
          {{ Math.round(progressPercentage) }}% of {{ formatAmount(totalBudget) }} spent
          <template v-if="daysRemaining !== null">
            &middot; {{ daysRemaining }} day{{ daysRemaining === 1 ? '' : 's' }} left
          </template>
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
import { getStatusText, getDaysRemaining } from 'src/utils/plans'
import {
  formatCurrency,
  formatCurrencyPrivate,
  formatCurrencyWithSign,
  type CurrencyCode,
} from 'src/utils/currency'
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

const totalBudget = computed(() => props.overview?.totalBudget ?? props.plan.total ?? 0)
const totalSpent = computed(() => props.overview?.totalSpent ?? 0)
const remainingBudget = computed(() => props.overview?.remainingBudget ?? totalBudget.value)

const daysRemaining = computed(() => getDaysRemaining(props.plan))

const isOverBudget = computed(() => remainingBudget.value < 0)

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

const heroAmount = computed(() => {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrencyWithSign(animatedRemaining.value, currency)
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
  border-radius: var(--radius-xl);
  border: none;
  color: hsl(var(--hero-foreground));
  background:
    radial-gradient(120% 140% at 85% -20%, hsl(var(--hero-glow)) 0%, transparent 55%),
    linear-gradient(135deg, hsl(var(--hero-gradient-from)) 0%, hsl(var(--hero-gradient-to)) 100%);
  box-shadow: var(--shadow-md);
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

.budget-hero-card__chip {
  background: hsl(var(--hero-track));
  color: hsl(var(--hero-foreground));
}

.budget-hero-card__overline {
  color: hsl(var(--hero-muted));
}

.budget-hero-card__amount {
  color: hsl(var(--hero-foreground));
  display: flex;
  align-items: center;
}

.budget-hero-card__caption {
  color: hsl(var(--hero-muted));
}

.budget-hero-card__progress {
  border-radius: var(--radius-full);
  color: hsl(var(--hero-foreground));

  :deep(.q-linear-progress__track) {
    background: hsl(var(--hero-track));
    opacity: 1;
  }
}
</style>
