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
          class="row"
          :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
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
      </q-card-section>
    </q-card>

    <!-- Recent Expenses Section -->
    <RecentExpensesList
      :expenses="recentExpenses"
      :currency="planCurrency"
      :is-loading="false"
      :can-edit="isEditMode"
      @add-expense="$emit('open-expense-dialog')"
      @view-all="openAllExpensesDialog"
      @refresh="$emit('refresh')"
    />

    <!-- Category Expenses Modal -->
    <CategoryExpensesDialog
      v-model="showCategoryModal"
      :category="selectedCategory"
      :expenses="categoryExpenses"
      :currency="planCurrency"
      :can-edit="isEditMode"
      :plan-id="planId"
      :plan-items="categoryPlanItems"
      @add-expense="emitOpenExpenseDialog"
      @refresh="$emit('refresh')"
    />

    <!-- All Expenses Modal -->
    <AllExpensesDialog
      v-model="showAllExpensesModal"
      :expenses="expensesStore.sortedExpenses"
      :currency="planCurrency"
      :can-edit="isEditMode"
      :plan-id="planId"
      @refresh="$emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PlanSummaryCard from './PlanSummaryCard.vue'
import CategoryBudgetCard from './CategoryBudgetCard.vue'
import RecentExpensesList from './RecentExpensesList.vue'
import CategoryExpensesDialog from './CategoryExpensesDialog.vue'
import AllExpensesDialog from './AllExpensesDialog.vue'
import { usePlanOverview } from 'src/composables/usePlanOverview'
import { useExpensesStore } from 'src/stores/expenses'
import type { PlanWithItems } from 'src/api'
import type { CurrencyCode } from 'src/utils/currency'
import type { CategoryBudget } from 'src/types'

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  isOwner: boolean
  isEditMode: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'open-expense-dialog', categoryId?: string): void
  (e: 'view-items'): void
}>()

const expensesStore = useExpensesStore()

const showCategoryModal = ref(false)
const showAllExpensesModal = ref(false)
const selectedCategory = ref<CategoryBudget | null>(null)

const planCurrency = computed((): CurrencyCode => {
  return (props.plan?.currency as CurrencyCode) || 'USD'
})

const planId = computed(() => props.plan?.id || '')

const { categoryBudgets, recentExpenses, totalBudget, totalSpent, remainingBudget } =
  usePlanOverview(
    planId,
    computed(() => props.plan),
  )

const categoryExpenses = computed(() => {
  if (!selectedCategory.value) return []
  return expensesStore.sortedExpenses.filter(
    (e) => e.category_id === selectedCategory.value?.categoryId,
  )
})

const categoryPlanItems = computed(() => {
  if (!selectedCategory.value || !props.plan?.plan_items) return []
  return props.plan.plan_items.filter(
    (item) => item.category_id === selectedCategory.value?.categoryId,
  )
})

function openCategoryModal(category: CategoryBudget) {
  selectedCategory.value = category
  showCategoryModal.value = true
}

function emitOpenExpenseDialog() {
  showCategoryModal.value = false
  emit('open-expense-dialog', selectedCategory.value?.categoryId)
}

function openAllExpensesDialog() {
  showAllExpensesModal.value = true
}

watch(
  categoryBudgets,
  (newBudgets) => {
    if (selectedCategory.value) {
      const updatedCategory = newBudgets.find(
        (budget) => budget.categoryId === selectedCategory.value?.categoryId,
      )
      if (updatedCategory) {
        selectedCategory.value = updatedCategory
      }
    }
  },
  { deep: true },
)
</script>
