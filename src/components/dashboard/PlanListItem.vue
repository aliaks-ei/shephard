<template>
  <q-item
    clickable
    @click="emit('click', plan.id)"
  >
    <q-item-section
      side
      class="q-pr-sm"
    >
      <q-icon
        name="eva-calendar-outline"
        color="primary"
        size="16px"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="row items-center no-wrap">
        <span class="ellipsis">{{ plan.name }}</span>
        <q-icon
          v-if="isViewOnly"
          name="eva-lock-outline"
          size="14px"
          class="text-warning q-ml-xs"
        />
        <q-icon
          v-if="!isOwner"
          name="eva-people-outline"
          size="14px"
          class="text-info q-ml-xs"
        />
      </q-item-label>
      <q-item-label caption>
        {{ formatDateRange(plan.start_date, plan.end_date) }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      side
      class="items-end"
    >
      <span class="text-weight-medium text-body2">
        {{ formatAmount(plan.total) }}
      </span>
      <q-skeleton
        v-if="isOverviewLoading"
        type="text"
        width="60px"
        class="q-mt-xs"
      />
      <q-btn
        v-else-if="hasLoadError"
        flat
        dense
        no-caps
        color="negative"
        label="Retry"
        :loading="isRetrying"
        @click.stop="retry"
      />
      <div
        v-else
        class="text-caption text-grey-6"
      >
        {{ remainingBudget >= 0 ? 'Still to pay' : 'Over' }}:
        <span :class="remainingColorClass">{{ formatAmount(Math.abs(remainingBudget)) }}</span>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { formatDateRange } from 'src/utils/plans'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import type { PlanWithPermission } from 'src/api'
import { getBudgetRemainingColorClass } from 'src/utils/budget'
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

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const isOwner = computed(() => props.plan.owner_id === userStore.userProfile?.id)
const isViewOnly = computed(() => props.plan.permission_level === 'view')

const totalBudget = computed(() => props.overview?.totalBudget ?? props.plan.total ?? 0)
const totalSpent = computed(() => props.overview?.totalSpent ?? 0)
const remainingBudget = computed(() => props.overview?.remainingBudget ?? totalBudget.value)

const progressPercentage = computed(() => {
  if (totalBudget.value === 0) return 0
  return (totalSpent.value / totalBudget.value) * 100
})

const remainingColorClass = computed(() => getBudgetRemainingColorClass(progressPercentage.value))

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}

function retry(): void {
  emit('retry')
}
</script>
