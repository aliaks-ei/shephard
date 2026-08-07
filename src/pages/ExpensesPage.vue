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
import { useMeta } from 'quasar'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import EmptyExpensesState from 'src/components/expenses/EmptyExpensesState.vue'
import ExpenseListItem from 'src/components/expenses/ExpenseListItem.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { useExpensesPage } from 'src/composables/useExpensesPage'

useMeta({ title: 'Activity' })

const {
  searchQuery, sortBy, selectedCategoryId, isPending, hasNextPage,
  isFetchingNextPage, fetchNextPage, isOffline, hasExpensePlan, canAddExpense,
  hasLoadError, isRetrying, sortOptions, hasOpenedExpenseDialog, showExpenseDialog,
  availableCategories, hasActiveFilter, dayGroups, retryActivity, onRefresh,
  openExpenseDialog, toggleCategory, clearFilters, expenseCurrency, sourcePlanRoute,
} = useExpensesPage()
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
