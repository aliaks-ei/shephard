<template>
  <q-pull-to-refresh
    :disable="!$q.screen.lt.md"
    @refresh="onRefresh"
  >
    <ListPageLayout
      title="Activity"
      description="Your spending across all plans"
      create-button-label="Add Expense"
      :show-create-button="hasExpensePlan"
      :create-button-disabled="isOffline"
      @create="openExpenseDialog"
    >
      <SearchAndSort
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        search-placeholder="Search expenses..."
        :sort-options="sortOptions"
      />

      <!-- Category filter chips -->
      <div
        v-if="availableCategories.length > 1"
        class="category-filter-row q-mb-md"
      >
        <q-chip
          v-for="category in availableCategories"
          :key="category.id"
          clickable
          :aria-pressed="String(selectedCategoryId === category.id)"
          :class="{ 'category-filter-chip--active': selectedCategoryId === category.id }"
          class="category-filter-chip"
          @click="toggleCategory(category.id)"
        >
          <q-icon
            :name="category.icon || 'eva-folder-outline'"
            size="14px"
            class="q-mr-xs"
          />
          {{ category.name }}
        </q-chip>
      </div>

      <!-- Loading skeleton -->
      <q-card
        v-if="isPending && !isOffline"
        :bordered="$q.dark.isActive"
        class="shadow-1"
      >
        <q-card-section>
          <div
            v-for="n in 6"
            :key="n"
            class="row items-center q-py-sm"
          >
            <q-skeleton
              type="QAvatar"
              size="32px"
              class="q-mr-md"
            />
            <div class="col">
              <q-skeleton
                type="text"
                width="50%"
              />
              <q-skeleton
                type="text"
                width="30%"
              />
            </div>
            <q-skeleton
              type="text"
              width="60px"
            />
          </div>
        </q-card-section>
      </q-card>

      <QueryErrorState
        v-else-if="hasLoadError"
        entity-name="Activity"
        :retrying="isRetrying"
        @retry="retryActivity"
      />

      <!-- Incrementally loaded day-grouped expense list -->
      <template v-else-if="dayGroups.length > 0">
        <div
          v-for="group in dayGroups"
          :key="group.date"
          class="q-mb-md"
        >
          <div class="row items-baseline justify-between q-px-sm q-mb-xs">
            <h2 class="text-subtitle2 text-weight-medium q-my-none">
              {{ group.label }}
            </h2>
            <span class="text-caption text-amount">{{ group.totalLabel }}</span>
          </div>
          <q-card
            :bordered="$q.dark.isActive"
            class="shadow-1"
          >
            <q-list separator>
              <ExpenseListItem
                v-for="expense in group.expenses"
                :key="expense.id"
                :expense="expense"
                :currency="expenseCurrency(expense)"
                :can-edit="true"
                show-category
                :category-name="expense.plans?.name || ''"
                :category-color="expense.categories?.color || '#666'"
                :category-icon="expense.categories?.icon || 'eva-folder-outline'"
                :to="sourcePlanRoute(expense)"
              />
            </q-list>
          </q-card>
        </div>

        <div
          v-if="hasNextPage"
          class="row justify-center q-mt-md"
        >
          <q-btn
            flat
            no-caps
            color="primary"
            label="Load more activity"
            :loading="isFetchingNextPage"
            @click="void fetchNextPage()"
          />
        </div>
      </template>

      <!-- Empty: filtered -->
      <EmptyState
        v-else-if="hasActiveFilter"
        :has-search-query="true"
        search-icon="eva-search-outline"
        search-title="No matching expenses"
        search-description="Try a different search or clear the filters."
        create-button-label="Add Expense"
        :show-create-button="canAddExpense"
        @clear-search="clearFilters"
        @create="openExpenseDialog"
      />

      <!-- Empty: no expenses at all -->
      <EmptyExpensesState
        v-else
        :can-add-expense="canAddExpense"
        @add-expense="openExpenseDialog"
      />

      <!-- Expense Registration Dialog -->
      <ExpenseRegistrationDialog
        v-if="canAddExpense && hasOpenedExpenseDialog"
        v-model="showExpenseDialog"
        auto-select-recent-plan
        @expense-created="showExpenseDialog = false"
      />
    </ListPageLayout>
  </q-pull-to-refresh>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMeta, useQuasar } from 'quasar'
import { refDebounced } from '@vueuse/core'
import type { RouteLocationRaw } from 'vue-router'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import EmptyExpensesState from 'src/components/expenses/EmptyExpensesState.vue'
import ExpenseListItem from 'src/components/expenses/ExpenseListItem.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useRecentExpensesInfiniteQuery } from 'src/queries/expenses'
import { usePlansQuery } from 'src/queries/plans'
import { useCategoriesQuery } from 'src/queries/categories'
import { queryKeys } from 'src/queries/query-keys'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { formatDateRelative } from 'src/utils/date'
import type { ExpenseSort, ExpenseWithCategoryAndPlan } from 'src/api'
import { useNetworkStatus } from 'src/composables/useNetworkStatus'

useMeta({ title: 'Activity' })

const $q = useQuasar()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

const userId = computed(() => userStore.userProfile?.id)
const searchQuery = ref('')
const debouncedSearchQuery = refDebounced(searchQuery, 300)
const sortBy = ref('date-desc')
const expenseSort = computed<ExpenseSort>(() => {
  switch (sortBy.value) {
    case 'date-desc':
    case 'date-asc':
    case 'amount-desc':
    case 'amount-asc':
      return sortBy.value
    default:
      return 'date-desc'
  }
})
const selectedCategoryId = ref<string | null>(null)
const expenseFilters = computed(() => ({
  search: debouncedSearchQuery.value,
  categoryId: selectedCategoryId.value,
  sortBy: expenseSort.value,
}))
const expensesQuery = useRecentExpensesInfiniteQuery(userId, expenseFilters)
const { expenses, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = expensesQuery
const { plansForExpenses } = usePlansQuery(userId)
const { categories } = useCategoriesQuery()
const { isOnline, isOffline } = useNetworkStatus()
const hasExpensePlan = computed(() => plansForExpenses.value.length > 0)
const canAddExpense = computed(() => isOnline.value && hasExpensePlan.value)
const queryClient = useQueryClient()
const hasLoadError = computed(
  () => ((expensesQuery.isError?.value ?? false) || isOffline.value) && expenses.value.length === 0,
)
const isRetrying = computed(() => expensesQuery.isFetching?.value ?? false)

async function retryActivity(): Promise<void> {
  await expensesQuery.refetch?.()
}

async function onRefresh(done: () => void) {
  try {
    await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.recentAll() })
  } finally {
    done()
  }
}

const sortOptions = [
  { label: 'Newest first', value: 'date-desc' },
  { label: 'Oldest first', value: 'date-asc' },
  { label: 'Highest amount', value: 'amount-desc' },
  { label: 'Lowest amount', value: 'amount-asc' },
]

const hasOpenedExpenseDialog = ref(false)
const showExpenseDialog = ref(false)

function openExpenseDialog() {
  if (!isOnline.value || !canAddExpense.value) return

  hasOpenedExpenseDialog.value = true
  showExpenseDialog.value = true
}

const availableCategories = computed(() => {
  return [...categories.value].sort((a, b) => a.name.localeCompare(b.name))
})

function toggleCategory(categoryId: string) {
  selectedCategoryId.value = selectedCategoryId.value === categoryId ? null : categoryId
}

const hasActiveFilter = computed(() => !!searchQuery.value || !!selectedCategoryId.value)

function clearFilters() {
  searchQuery.value = ''
  selectedCategoryId.value = null
}

type DayGroup = {
  date: string
  label: string
  totalLabel: string
  expenses: ExpenseWithCategoryAndPlan[]
}

const isDateSort = computed(() => sortBy.value === 'date-desc' || sortBy.value === 'date-asc')

const dayGroups = computed((): DayGroup[] => {
  if (expenses.value.length === 0) return []

  // Amount sorts render as a single flat group
  if (!isDateSort.value) {
    return [
      {
        date: 'all',
        label: 'All expenses',
        totalLabel: groupTotalLabel(expenses.value),
        expenses: expenses.value,
      },
    ]
  }

  const groups = new Map<string, ExpenseWithCategoryAndPlan[]>()
  expenses.value.forEach((expense) => {
    const day = expense.expense_date.slice(0, 10)
    const group = groups.get(day)
    if (group) {
      group.push(expense)
    } else {
      groups.set(day, [expense])
    }
  })

  return Array.from(groups.entries()).map(([date, dayExpenses]) => ({
    date,
    label: formatDateRelative(date),
    totalLabel: groupTotalLabel(dayExpenses),
    expenses: dayExpenses,
  }))
})

function expenseCurrency(expense: ExpenseWithCategoryAndPlan): CurrencyCode {
  return (expense.plans?.currency ?? preferencesStore.currency) as CurrencyCode
}

function sourcePlanRoute(expense: ExpenseWithCategoryAndPlan): RouteLocationRaw {
  const planId = expense.plans?.id ?? expense.plan_id

  return {
    name: 'plan',
    params: { id: planId },
  }
}

function groupTotalLabel(groupExpenses: ExpenseWithCategoryAndPlan[]): string {
  const first = groupExpenses[0]
  if (!first) return ''

  const currency = expenseCurrency(first)

  if (preferencesStore.isPrivacyModeEnabled) {
    return formatCurrencyPrivate(currency)
  }

  // Mixed currencies within one day can't be summed meaningfully
  const hasMixedCurrencies = groupExpenses.some((expense) => expenseCurrency(expense) !== currency)
  if (hasMixedCurrencies) return ''

  const total = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  return formatCurrency(total, currency)
}
</script>

<style lang="scss" scoped>
.category-filter-row {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
}

.category-filter-chip {
  flex: 0 0 auto;
  min-height: 44px;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.category-filter-chip--active {
  background: hsl(var(--primary) / 0.14);
  color: hsl(var(--primary));
  box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.3);
}
</style>
