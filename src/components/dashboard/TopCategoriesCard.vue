<template>
  <q-card
    v-if="topCategories.length > 0"
    :bordered="$q.dark.isActive"
    class="shadow-1"
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <h2 class="text-subtitle1 text-weight-medium q-my-none">Top categories</h2>
      </div>

      <div
        v-for="(category, index) in topCategories"
        :key="category.categoryId"
        class="top-category-row"
        :class="{ 'q-mt-md': index > 0 }"
      >
        <div class="row items-center justify-between no-wrap">
          <div class="text-body2 ellipsis col q-pr-sm">{{ category.categoryName }}</div>
          <div class="text-body2 text-weight-medium text-amount row items-center no-wrap">
            <q-icon
              v-if="category.remainingAmount < 0"
              name="eva-alert-triangle-outline"
              size="14px"
              class="text-warning q-mr-xs"
            />
            {{ formatAmount(category.actualAmount) }}
          </div>
        </div>
        <q-linear-progress
          :value="categoryProgress(category)"
          :style="{ color: chartColor(index) }"
          :aria-label="`${category.categoryName}: ${formatAmount(category.actualAmount)} of ${formatAmount(category.plannedAmount)}`"
          size="6px"
          class="top-category-row__bar q-mt-xs"
        />
      </div>

      <q-btn
        flat
        no-caps
        dense
        color="primary"
        class="q-mt-md"
        icon-right="eva-arrow-forward-outline"
        label="See all categories"
        @click="emit('click', plan.id)"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { usePlanDetailQuery } from 'src/queries/plans'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import { usePlanOverview } from 'src/composables/usePlanOverview'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import type { PlanWithPermission } from 'src/api'
import type { CategoryBudget } from 'src/types'

const emit = defineEmits<{
  click: [planId: string]
}>()

const props = defineProps<{
  plan: PlanWithPermission
}>()

const $q = useQuasar()
const userStore = useUserStore()
const userId = computed(() => userStore.userProfile?.id)
const preferencesStore = usePreferencesStore()

const planId = computed(() => props.plan.id)
const planDetailQuery = usePlanDetailQuery(planId, userId)
const planWithItems = computed(() => planDetailQuery.data.value ?? null)

const { categoryBudgets } = usePlanOverview(planId, planWithItems)

const topCategories = computed(() =>
  [...categoryBudgets.value].sort((a, b) => b.actualAmount - a.actualAmount).slice(0, 3),
)

// Category accents intentionally avoid the over/under-budget green/orange/red semantics
const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']

function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] as string
}

function categoryProgress(category: CategoryBudget): number {
  if (category.plannedAmount <= 0) return 0
  return Math.min(category.actualAmount / category.plannedAmount, 1)
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
.top-category-row__bar {
  border-radius: var(--radius-full);
}
</style>
