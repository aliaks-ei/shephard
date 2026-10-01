<template>
  <q-card
    v-if="hasLoadError || topCategories.length > 0"
    :bordered="$q.dark.isActive"
    class="shadow-1 dashboard-mobile-section"
  >
    <QueryErrorState
      v-if="hasLoadError"
      compact
      entity-name="Top categories"
      :retrying="isRetrying ?? false"
      @retry="retry"
    />

    <q-card-section v-else>
      <div class="row items-center justify-between no-wrap q-mb-md">
        <h2 class="text-subtitle1 text-weight-bold q-my-none">Spent by category</h2>
        <q-btn
          flat
          no-caps
          dense
          color="primary"
          class="q-px-sm"
          label="See all"
          @click="emit('click', plan.id)"
        />
      </div>

      <!-- One stacked bar: each segment is a category's share of the budget -->
      <div
        class="category-stack"
        role="img"
        :aria-label="stackLabel"
      >
        <div
          v-for="segment in segments"
          :key="segment.categoryId"
          class="category-stack__segment category-tone-fg"
          :style="[getCategoryToneStyle(segment.categoryColor), { width: `${segment.share}%` }]"
        />
      </div>

      <ul class="category-legend q-mt-md q-mb-none q-pl-none">
        <li
          v-for="category in topCategories"
          :key="category.categoryId"
          class="category-legend__row row items-center no-wrap"
        >
          <span
            class="category-legend__dot category-tone-fg"
            :style="getCategoryToneStyle(category.categoryColor)"
          />
          <span class="col ellipsis q-pl-sm">{{ category.categoryName }}</span>
          <span
            v-if="category.actualAmount > category.plannedAmount"
            class="text-over text-amount text-weight-bold q-mr-sm category-legend__over"
          >
            {{ formatAmount(category.actualAmount - category.plannedAmount) }} over
          </span>
          <span class="text-ink text-amount text-weight-bold">
            {{ formatAmount(category.actualAmount) }}
          </span>
        </li>
      </ul>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { usePreferencesStore } from 'src/stores/preferences'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { getCategoryToneStyle } from 'src/utils/categories'
import type { PlanWithPermission } from 'src/api'
import type { DashboardPlanOverview } from 'src/composables/useDashboardOverview'

const emit = defineEmits<{
  click: [planId: string]
  retry: []
}>()

const props = defineProps<{
  plan: PlanWithPermission
  overview: DashboardPlanOverview | null
  hasLoadError?: boolean
  isRetrying?: boolean
}>()

const $q = useQuasar()
const preferencesStore = usePreferencesStore()

const spentCategories = computed(() =>
  [...(props.overview?.categoryBudgets ?? [])]
    .filter((category) => category.actualAmount > 0)
    .sort((a, b) => b.actualAmount - a.actualAmount),
)

const topCategories = computed(() => spentCategories.value.slice(0, 3))

// Segments share the whole budget, so the empty track is what is left
const segments = computed(() => {
  const totalSpent = spentCategories.value.reduce((sum, c) => sum + c.actualAmount, 0)
  const scale = Math.max(props.overview?.totalBudget ?? 0, totalSpent)
  if (scale <= 0) return []
  return spentCategories.value.map((category) => ({
    ...category,
    share: (category.actualAmount / scale) * 100,
  }))
})

const stackLabel = computed(() =>
  topCategories.value
    .map((category) => `${category.categoryName} ${formatAmount(category.actualAmount)}`)
    .join(', '),
)

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

<style lang="scss" scoped>
.category-stack {
  display: flex;
  gap: 2px;
  height: 10px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: hsl(var(--muted-foreground) / 0.14);
}

.category-stack__segment {
  height: 100%;
  min-width: 4px;
  background: currentColor;
  transform-origin: 0 50%;
  animation: progress-grow 700ms var(--ease-out-quint) both;
}

.category-legend {
  list-style: none;
}

.category-legend__row {
  min-height: 32px;
}

.category-legend__dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 3px;
  background: currentColor;
}

.category-legend__over {
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .category-stack__segment {
    animation: none;
  }
}
</style>
