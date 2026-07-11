<template>
  <div>
    <!-- Plan Summary Card -->
    <PlanSummaryCard
      :plan="plan"
      :total-budget="totalBudget"
      :total-spent="totalSpent"
      :still-to-pay="remainingBudget"
      :currency="planCurrency"
    />

    <!-- Category Budget Cards Grid -->
    <q-card
      class="bg-transparent"
      flat
    >
      <q-card-section class="q-px-none">
        <div class="row items-center q-mb-md">
          <q-icon
            name="eva-pie-chart-outline"
            class="q-mr-sm"
            size="24px"
          />
          <h2 class="text-h6 q-my-none">Budget by Category</h2>
        </div>

        <div
          v-if="categoryBudgets.length === 0"
          class="text-center text-muted q-py-lg"
        >
          <q-icon
            name="eva-folder-outline"
            size="48px"
            class="q-mb-md"
          />
          <div>No categories in this plan yet</div>
        </div>

        <template v-else>
          <div v-if="$q.screen.lt.md">
            <q-card :bordered="$q.dark.isActive">
              <q-list
                id="mobile-category-budgets"
                separator
                class="plan-overview-mobile-budget-list"
              >
                <CategoryBudgetListItem
                  v-for="category in mobileCategoryBudgets"
                  :key="category.categoryId"
                  :category="category"
                  :currency="planCurrency"
                  @click="openCategoryModal(category)"
                />
              </q-list>
            </q-card>

            <div
              v-if="hasHiddenMobileCategories"
              class="row justify-center q-mt-sm"
            >
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                :label="mobileCategoriesToggleLabel"
                aria-controls="mobile-category-budgets"
                :aria-expanded="String(showAllMobileCategories)"
                class="mobile-categories-toggle"
                @click="toggleMobileCategoryVisibility"
              />
            </div>
          </div>

          <div
            v-else
            class="row q-col-gutter-md"
          >
            <div
              v-for="category in categoryBudgets"
              :key="category.categoryId"
              class="col-12 col-sm-6 col-md-4"
            >
              <CategoryBudgetCard
                :category="category"
                :currency="planCurrency"
                @click="openCategoryModal(category)"
              />
            </div>
          </div>
        </template>
      </q-card-section>
    </q-card>

    <!-- Recent Expenses Section -->
    <RecentExpensesList
      :expenses="recentExpenses"
      :currency="planCurrency"
      :is-loading="false"
      :can-edit="isEditMode"
      :can-add-expenses="canAddExpenses"
      @add-expense="$emit('open-expense-dialog')"
      @view-all="openAllExpensesDialog"
      @refresh="$emit('refresh')"
    />

    <!-- Category Expenses Modal -->
    <CategoryExpensesDialog
      v-if="showCategoryModal"
      v-model="showCategoryModal"
      :category="selectedCategory"
      :expenses="categoryExpenses"
      :currency="planCurrency"
      :can-edit="isEditMode"
      :can-add-expenses="canAddExpenses"
      :plan-id="planId"
      :plan-items="categoryPlanItems"
      :is-loading-expenses="categoryHistoryQuery.isPending.value"
      :is-loading-more-expenses="categoryHistoryQuery.isFetchingNextPage.value"
      :has-more-expenses="categoryHistoryQuery.hasNextPage.value"
      :has-expenses-load-error="categoryHistoryQuery.isError.value && categoryExpenses.length === 0"
      :is-retrying-expenses="categoryHistoryQuery.isFetching.value"
      @add-expense="emitOpenExpenseDialog"
      @refresh="$emit('refresh')"
      @load-more-expenses="void categoryHistoryQuery.fetchNextPage()"
      @expenses-tab-activated="categoryHistoryEnabled = true"
      @retry-expenses="void categoryHistoryQuery.refetch()"
    />

    <!-- All Expenses Modal -->
    <AllExpensesDialog
      v-if="showAllExpensesModal"
      v-model="showAllExpensesModal"
      :expenses="historyExpenses"
      :currency="planCurrency"
      :can-edit="isEditMode"
      :plan-id="planId"
      :is-loading="historyQuery.isPending.value"
      :is-loading-more="historyQuery.isFetchingNextPage.value"
      :has-more="historyQuery.hasNextPage.value"
      :has-load-error="historyQuery.isError.value && historyExpenses.length === 0"
      :is-retrying="historyQuery.isFetching.value"
      @refresh="$emit('refresh')"
      @load-more="void historyQuery.fetchNextPage()"
      @retry="void historyQuery.refetch()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PlanSummaryCard from './PlanSummaryCard.vue'
import CategoryBudgetCard from './CategoryBudgetCard.vue'
import CategoryBudgetListItem from './CategoryBudgetListItem.vue'
import RecentExpensesList from './RecentExpensesList.vue'
import CategoryExpensesDialog from './CategoryExpensesDialog.vue'
import AllExpensesDialog from './AllExpensesDialog.vue'
import { usePlanOverview } from 'src/composables/usePlanOverview'
import type { PlanWithItems } from 'src/api'
import type { CurrencyCode } from 'src/utils/currency'
import type { CategoryBudget } from 'src/types'

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  isOwner: boolean
  isEditMode: boolean
  canAddExpenses: boolean
}>()

const emit = defineEmits<{
  refresh: []
  'open-expense-dialog': [categoryId?: string]
  'view-items': []
}>()

const planIdRef = computed(() => props.plan?.id ?? null)

const showCategoryModal = ref(false)
const showAllExpensesModal = ref(false)
const showAllMobileCategories = ref(false)
const categoryHistoryEnabled = ref(false)
const selectedCategory = ref<CategoryBudget | null>(null)
const mobileInitialCategoryCount = 5

const planCurrency = computed((): CurrencyCode => {
  return (props.plan?.currency as CurrencyCode) || 'USD'
})

const planId = computed(() => props.plan?.id || '')
const selectedCategoryId = computed(() => selectedCategory.value?.categoryId ?? null)

const {
  categoryBudgets,
  recentExpenses,
  historyExpenses,
  categoryExpenses,
  historyQuery,
  categoryHistoryQuery,
  totalBudget,
  totalSpent,
  remainingBudget,
} = usePlanOverview(
  planIdRef,
  computed(() => props.plan),
  {
    historyEnabled: showAllExpensesModal,
    categoryId: selectedCategoryId,
    categoryHistoryEnabled,
  },
)

const mobileCategoryBudgets = computed(() => {
  if (showAllMobileCategories.value) {
    return categoryBudgets.value
  }
  return categoryBudgets.value.slice(0, mobileInitialCategoryCount)
})

const hiddenMobileCategoriesCount = computed(() => {
  return Math.max(categoryBudgets.value.length - mobileInitialCategoryCount, 0)
})

const hasHiddenMobileCategories = computed(() => hiddenMobileCategoriesCount.value > 0)

const mobileCategoriesToggleLabel = computed(() => {
  if (showAllMobileCategories.value) {
    return 'Show less'
  }
  return `View all (${hiddenMobileCategoriesCount.value})`
})

const categoryPlanItems = computed(() => {
  if (!selectedCategory.value || !props.plan?.plan_items) return []
  return props.plan.plan_items.filter(
    (item) => item.category_id === selectedCategory.value?.categoryId,
  )
})

function openCategoryModal(category: CategoryBudget) {
  selectedCategory.value = category
  categoryHistoryEnabled.value = !props.plan?.plan_items.some(
    (item) => item.category_id === category.categoryId,
  )
  showCategoryModal.value = true
}

function emitOpenExpenseDialog() {
  showCategoryModal.value = false
  emit('open-expense-dialog', selectedCategory.value?.categoryId)
}

function openAllExpensesDialog() {
  showAllExpensesModal.value = true
}

function toggleMobileCategoryVisibility() {
  showAllMobileCategories.value = !showAllMobileCategories.value
}

watch(categoryBudgets, (newBudgets) => {
  if (selectedCategory.value) {
    const updatedCategory = newBudgets.find(
      (budget) => budget.categoryId === selectedCategory.value?.categoryId,
    )
    if (updatedCategory) {
      selectedCategory.value = updatedCategory
    }
  }
})

watch(hasHiddenMobileCategories, (hasHiddenCategories) => {
  if (!hasHiddenCategories) {
    showAllMobileCategories.value = false
  }
})
</script>

<style lang="scss" scoped>
.mobile-categories-toggle {
  min-height: 44px;
}
</style>
