<template>
  <q-card
    clickable
    :bordered="$q.dark.isActive"
    class="shadow-1 cursor-pointer"
    @click="emit('click', plan.id)"
  >
    <q-card-section>
      <!-- Loading state -->
      <template v-if="isOverviewLoading">
        <div class="row items-center justify-between q-mb-md">
          <q-skeleton
            type="text"
            width="40%"
          />
          <q-skeleton
            type="QChip"
            width="80px"
          />
        </div>
        <div class="row q-col-gutter-sm q-mb-sm">
          <div
            v-for="n in 3"
            :key="n"
            class="col"
          >
            <q-skeleton
              type="text"
              width="60%"
            />
            <q-skeleton
              type="text"
              width="80%"
            />
          </div>
        </div>
        <q-skeleton
          type="rect"
          height="8px"
        />
        <q-skeleton
          type="text"
          width="50%"
          class="q-mt-xs"
        />
      </template>

      <!-- Loaded state -->
      <template v-else>
        <!-- Row 1: Plan name + status chip -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-subtitle1 text-weight-medium ellipsis col">
            {{ plan.name }}
          </div>
          <q-chip
            :color="getStatusColor(plan)"
            text-color="white"
            size="sm"
            square
          >
            {{ getStatusText(plan) }}
          </q-chip>
        </div>

        <!-- Row 2: Three metrics -->
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col">
            <div class="text-caption text-grey-6">Spent</div>
            <div class="text-weight-bold text-info">
              {{ formatAmount(totalSpent) }}
            </div>
          </div>
          <div class="col">
            <div class="text-caption text-grey-6">Budget</div>
            <div class="text-weight-bold">
              {{ formatAmount(totalBudget) }}
            </div>
          </div>
          <div class="col">
            <div class="text-caption text-grey-6">
              {{ remainingBudget >= 0 ? 'Remaining' : 'Over' }}
            </div>
            <div
              class="text-weight-bold"
              :class="remainingColorClass"
            >
              {{ formatAmount(Math.abs(remainingBudget)) }}
            </div>
          </div>
        </div>

        <!-- Row 3: Progress bar -->
        <q-linear-progress
          :value="overallProgress"
          :color="progressColor"
          size="8px"
        />

        <!-- Row 4: Caption with percentage + days remaining -->
        <div class="text-caption text-grey-6 q-mt-xs">
          {{ Math.round(progressPercentage) }}% of budget spent
          <template v-if="daysRemaining !== null">
            &middot; {{ daysRemaining }} day{{ daysRemaining === 1 ? '' : 's' }} left
          </template>
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePlansStore } from 'src/stores/plans'
import { useExpensesStore } from 'src/stores/expenses'
import { usePreferencesStore } from 'src/stores/preferences'
import { usePlanOverview } from 'src/composables/usePlanOverview'
import { getStatusColor, getStatusText, getDaysRemaining } from 'src/utils/plans'
import { getBudgetProgressColor, getBudgetRemainingColorClass } from 'src/utils/budget'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import type { PlanWithPermission, PlanWithItems } from 'src/api'

const emit = defineEmits<{
  click: [planId: string]
}>()

const props = defineProps<{
  plan: PlanWithPermission
}>()

const plansStore = usePlansStore()
const expensesStore = useExpensesStore()
const preferencesStore = usePreferencesStore()

const planWithItems = ref<PlanWithItems | null>(null)
const isOverviewLoading = ref(true)

const { totalBudget, totalSpent, remainingBudget } = usePlanOverview(
  computed(() => props.plan.id),
  planWithItems,
)

const daysRemaining = computed(() => getDaysRemaining(props.plan))

const progressPercentage = computed(() => {
  if (totalBudget.value === 0) return 0
  return (totalSpent.value / totalBudget.value) * 100
})

const progressColor = computed(() => getBudgetProgressColor(progressPercentage.value))
const remainingColorClass = computed(() => getBudgetRemainingColorClass(progressPercentage.value))

const overallProgress = computed(() => {
  if (totalBudget.value === 0) return 0
  return Math.min(totalSpent.value / totalBudget.value, 1)
})

function formatAmount(amount: number | null | undefined): string {
  const currency = props.plan.currency as CurrencyCode

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  return formatCurrency(amount, currency)
}

onMounted(async () => {
  isOverviewLoading.value = true
  const loaded = await plansStore.loadPlanWithItems(props.plan.id)
  planWithItems.value = loaded
  await Promise.all([
    expensesStore.loadExpensesForPlan(props.plan.id),
    expensesStore.loadExpenseSummaryForPlan(props.plan.id),
  ])
  isOverviewLoading.value = false
})
</script>
