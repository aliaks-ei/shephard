<template>
  <div>
    <!-- Plan Summary Card -->
    <PlanSummaryCard
      :plan="plan"
      :total-budget="totalBudget"
      :total-spent="totalSpent"
      :currency="planCurrency"
    />

    <!-- Category Budget Cards Grid -->
    <div class="q-mb-lg">
      <div class="text-h6 q-mb-md">
        <q-icon
          name="eva-pie-chart-outline"
          class="q-mr-sm"
        />
        Budget by Category
      </div>

      <div
        v-if="isLoadingExpenses"
        class="row q-col-gutter-md"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <q-skeleton
                type="text"
                width="60%"
                class="q-mb-sm"
              />
              <q-skeleton
                type="QAvatar"
                size="100px"
                class="q-mx-auto q-my-md"
              />
              <q-skeleton
                type="rect"
                height="20px"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div
        v-else-if="categoryBudgets.length === 0"
        class="text-center text-grey-6 q-py-lg"
      >
        <q-icon
          name="eva-folder-outline"
          size="48px"
          class="q-mb-md"
        />
        <div>No categories in this plan yet</div>
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
    </div>

    <!-- Recent Expenses Section -->
    <RecentExpensesList
      :expenses="recentExpenses"
      :currency="planCurrency"
      :is-loading="isLoadingExpenses"
      @add-expense="$emit('open-expense-dialog')"
    />

    <!-- Category Expenses Modal -->
    <CategoryExpensesModal
      v-model="showCategoryModal"
      :category="selectedCategory"
      :expenses="categoryExpenses"
      :currency="planCurrency"
      :can-edit="isEditMode"
      :plan-id="planId"
      @add-expense="emitOpenExpenseDialog"
      @refresh="loadOverviewData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import PlanSummaryCard from './PlanSummaryCard.vue'
import CategoryBudgetCard from './CategoryBudgetCard.vue'
import RecentExpensesList from './RecentExpensesList.vue'
import CategoryExpensesModal from './CategoryExpensesModal.vue'
import { usePlanOverview } from 'src/composables/usePlanOverview'
import { useExpensesStore } from 'src/stores/expenses'
import type { PlanWithItems } from 'src/api'
import type { CurrencyCode } from 'src/utils/currency'

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  isOwner: boolean
  isEditMode: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'open-expense-dialog', categoryId?: string): void
}>()

const expensesStore = useExpensesStore()

interface CategoryBudget {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  plannedAmount: number
  actualAmount: number
  remainingAmount: number
  expenseCount: number
}

// Modal state
const showCategoryModal = ref(false)
const selectedCategory = ref<CategoryBudget | null>(null)

// Loading state
const isLoadingExpenses = ref(false)

// Computed properties
const planCurrency = computed((): CurrencyCode => {
  return (props.plan?.currency as CurrencyCode) || 'USD'
})

const planId = computed(() => props.plan?.id || '')

// Use the plan overview composable
const { categoryBudgets, recentExpenses, totalBudget, totalSpent, loadOverviewData } =
  usePlanOverview(planId.value, props.plan)

// Category expenses for modal
const categoryExpenses = computed(() => {
  if (!selectedCategory.value) return []
  return expensesStore.expenses.filter((e) => e.category_id === selectedCategory.value?.categoryId)
})

// Methods
function openCategoryModal(category: CategoryBudget) {
  selectedCategory.value = category
  showCategoryModal.value = true
}

function emitOpenExpenseDialog() {
  // If user opens from a category, preselect current plan & category via parent dialog props
  // Emit so PlanPage can open dialog with defaults
  // For now, bubble the same event up
  // Consumers (PlanPage) already pass currentPlanId; we only need to close modal
  showCategoryModal.value = false
  // Defer to parent to open dialog with defaults
  // Parent already handles showing ExpenseRegistrationDialog
  // and has currentPlan in scope
  // We still emit to keep existing wiring
  // Emit is declared via defineEmits above
  emit('open-expense-dialog', selectedCategory.value?.categoryId)
}

// Load data when component mounts or plan changes
onMounted(async () => {
  if (props.plan) {
    isLoadingExpenses.value = true
    try {
      await loadOverviewData()
    } finally {
      isLoadingExpenses.value = false
    }
  }
})

watch(
  () => props.plan?.id,
  async (newId) => {
    if (newId) {
      isLoadingExpenses.value = true
      try {
        await loadOverviewData()
      } finally {
        isLoadingExpenses.value = false
      }
    }
  },
)
</script>
