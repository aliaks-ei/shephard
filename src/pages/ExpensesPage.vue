<template>
  <q-pull-to-refresh
    :disable="!$q.screen.lt.md"
    @refresh="onRefresh"
  >
    <ListPageLayout
      title="Activity"
      :show-create-button="false"
    >
      <q-card
        v-if="activitySummary"
        :bordered="$q.dark.isActive"
        class="activity-summary shadow-1 q-mb-md"
      >
        <q-card-section class="row items-end justify-between no-wrap q-gutter-x-md">
          <div class="col-auto">
            <div class="text-caption">{{ monthLabel }} so far</div>
            <div class="activity-summary__total text-amount text-ink">
              {{ activitySummary.monthTotalLabel }}
            </div>
          </div>
          <div
            class="activity-summary__strip col"
            role="img"
            aria-label="Spending per day for the last 14 days"
          >
            <span
              v-for="day in activitySummary.days"
              :key="day.date"
              class="activity-summary__bar"
              :class="{
                'activity-summary__bar--today': day.isToday,
                'activity-summary__bar--empty': day.isEmpty,
              }"
              :style="{ height: `${day.height}%` }"
            />
          </div>
        </q-card-section>
      </q-card>

      <SearchAndSort
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        search-placeholder="Search expenses"
        :sort-options="sortOptions"
      />

      <!-- Category filter chips -->
      <div
        v-if="availableCategories.length > 1"
        class="category-filter-row q-mb-md"
      >
        <q-chip
          clickable
          :aria-pressed="String(selectedCategoryId === null)"
          :class="{ 'category-filter-chip--active': selectedCategoryId === null }"
          class="category-filter-chip"
          @click="selectedCategoryId = null"
        >
          All
        </q-chip>
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
      <div v-else-if="dayGroups.length > 0">
        <div
          v-for="group in dayGroups"
          :key="group.date"
          class="q-mb-md"
        >
          <div class="row items-baseline justify-between q-px-sm q-mb-xs">
            <h2 class="activity-day__label q-my-none">
              {{ group.label }}
            </h2>
            <span class="activity-day__total text-amount">{{ group.totalLabel }}</span>
          </div>
          <q-card
            :bordered="$q.dark.isActive"
            class="shadow-1 overflow-hidden"
          >
            <q-list separator>
              <ExpenseListItem
                v-for="expense in group.expenses"
                :key="expense.id"
                :expense="expense"
                :currency="expenseCurrency(expense)"
                :can-edit="true"
                show-category
                :show-date="group.date === 'all'"
                :category-name="expense.plans?.name || ''"
                :category-color="expense.categories?.color || DEFAULT_CATEGORY_COLOR"
                :category-icon="expense.categories?.icon || 'eva-folder-outline'"
                :to="sourcePlanRoute(expense)"
                item-class="pressable-row"
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
      </div>

      <!-- Empty: filtered -->
      <EmptyState
        v-else-if="hasActiveFilter"
        :has-search-query="true"
        search-icon="eva-search-outline"
        search-title="No matching expenses"
        search-description="Try a different search or clear the filters."
        create-button-label="Add expense"
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
import { useMeta } from 'quasar'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import EmptyExpensesState from 'src/components/expenses/EmptyExpensesState.vue'
import ExpenseListItem from 'src/components/expenses/ExpenseListItem.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { useExpensesPage } from 'src/composables/useExpensesPage'
import { DEFAULT_CATEGORY_COLOR } from 'src/utils/categories'

useMeta({ title: 'Activity' })

const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long' })

const {
  searchQuery,
  sortBy,
  selectedCategoryId,
  isPending,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isOffline,
  canAddExpense,
  hasLoadError,
  isRetrying,
  sortOptions,
  hasOpenedExpenseDialog,
  showExpenseDialog,
  availableCategories,
  hasActiveFilter,
  dayGroups,
  activitySummary,
  retryActivity,
  onRefresh,
  openExpenseDialog,
  toggleCategory,
  clearFilters,
  expenseCurrency,
  sourcePlanRoute,
} = useExpensesPage()
</script>

<style lang="scss" scoped>
.activity-summary__total {
  font-size: 26px;
  line-height: 1.15;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.activity-summary__strip {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 44px;
}

.activity-summary__bar {
  flex: 1 1 0;
  min-width: 0;
  border-radius: 3px;
  background: hsl(var(--primary) / 0.35);

  &--today {
    background: hsl(var(--primary));
  }

  &--empty {
    background: hsl(var(--muted-foreground) / 0.18);
  }
}

.activity-day__label {
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.activity-day__total {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

// Chips scroll sideways; the fade shows there is more past the edge
.category-filter-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-inline: -4px;
  padding-inline: 4px 32px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);

  &::-webkit-scrollbar {
    display: none;
  }
}

.category-filter-chip {
  flex: 0 0 auto;
  min-height: 44px;
  margin: 0;
  padding-inline: 14px;
  font-size: 14px;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.category-filter-chip--active {
  background: hsl(var(--primary) / 0.14);
  color: hsl(var(--primary));
  box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.3);
}
</style>
