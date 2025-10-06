import { ref, computed, type Ref } from 'vue'
import { useExpensesStore } from 'src/stores/expenses'
import { usePlansStore } from 'src/stores/plans'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { getPlanItems, updatePlanItemCompletion } from 'src/api/plans'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getPlanStatus } from 'src/utils/plans'
import type { PlanItem } from 'src/api/plans'
import type { PlanOption } from 'src/components/expenses/PlanSelectorField.vue'

export interface ExpenseRegistrationForm {
  planId: string | null
  categoryId: string | null
  name: string
  amount: number | null
  expenseDate: string
  planItemId: string | null
}

export type ExpenseMode = 'quick-select' | 'custom-entry'
export type QuickSelectPhase = 'selection' | 'finalize'

export function useExpenseRegistration(defaultPlanId?: Ref<string | null | undefined>) {
  const expensesStore = useExpensesStore()
  const plansStore = usePlansStore()
  const categoriesStore = useCategoriesStore()
  const notificationStore = useNotificationStore()

  const isLoading = ref(false)
  const isLoadingPlanItems = ref(false)
  const didAutoSelectPlan = ref(false)
  const currentMode = ref<ExpenseMode>('quick-select')
  const quickSelectPhase = ref<QuickSelectPhase>('selection')

  const planItems = ref<PlanItem[]>([])
  const selectedPlanItems = ref<PlanItem[]>([])

  const form = ref<ExpenseRegistrationForm>({
    planId: null,
    categoryId: null,
    name: '',
    amount: null,
    expenseDate: new Date().toISOString().split('T')[0]!,
    planItemId: null,
  })

  const mostRecentlyUsedPlan = computed(() => {
    if (!plansStore.plansForExpenses.length) return null

    const sortedPlans = [...plansStore.plansForExpenses].sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return dateB - dateA
    })

    return sortedPlans[0] || null
  })

  const planOptions = computed((): PlanOption[] => {
    return plansStore.plansForExpenses.map((plan) => ({
      label: plan.name,
      value: plan.id,
      status: getPlanStatus(plan),
      startDate: plan.start_date,
      endDate: plan.end_date,
      currency: plan.currency || 'USD',
    }))
  })

  const selectedPlan = computed(() => {
    if (!form.value.planId) return null
    return plansStore.plans.find((p) => p.id === form.value.planId) || null
  })

  const planDisplayValue = computed(() => {
    const id = form.value.planId
    if (!id) return ''
    const plan = plansStore.plans.find((p) => p.id === id)
    return plan?.name || ''
  })

  const categoryOptions = computed(() => {
    if (!selectedPlan.value) return []

    const summary = expensesStore.expenseSummary

    return categoriesStore.categories
      .filter((category) => summary.some((s) => s.category_id === category.id))
      .map((category) => {
        const categoryData = summary.find((s) => s.category_id === category.id)
        const plannedAmount = categoryData?.planned_amount || 0
        const actualAmount = categoryData?.actual_amount || 0

        return {
          label: category.name,
          value: category.id,
          color: category.color,
          icon: category.icon,
          plannedAmount,
          actualAmount,
          remainingAmount: plannedAmount - actualAmount,
        }
      })
  })

  const selectedItemsTotal = computed(() => {
    return selectedPlanItems.value.reduce((total, item) => total + item.amount, 0)
  })

  const budgetWarning = computed(() => {
    if (!form.value.categoryId || !form.value.amount || !selectedPlan.value) return ''

    const category = categoryOptions.value.find((c) => c.value === form.value.categoryId)
    if (!category) return ''

    const newRemaining = category.remainingAmount - form.value.amount
    const currency = selectedPlan.value.currency as CurrencyCode

    if (newRemaining < 0) {
      return `This expense will exceed the budget by ${formatCurrency(Math.abs(newRemaining), currency)}`
    }

    return ''
  })

  const nameRules = computed(() => [
    (val: string) => !!val?.trim() || 'Expense name is required',
    (val: string) => val.length <= 100 || 'Name must be 100 characters or less',
  ])

  const amountRules = computed(() => [
    (val: number) => !!val || 'Amount is required',
    (val: number) => val > 0 || 'Amount must be greater than 0',
    (val: number) => val <= 999999.99 || 'Amount too large',
  ])

  const getSubmitButtonLabel = computed(() => {
    if (currentMode.value === 'quick-select') {
      if (quickSelectPhase.value === 'selection') {
        return 'Continue'
      }
      const count = selectedPlanItems.value.length
      return count > 0 ? `Register ${count} Item${count !== 1 ? 's' : ''}` : 'Register Items'
    }
    return 'Register Expense'
  })

  const canSubmit = computed(() => {
    if (currentMode.value === 'quick-select') {
      if (quickSelectPhase.value === 'selection') {
        return selectedPlanItems.value.length > 0
      }
      return selectedPlanItems.value.length > 0 && !!form.value.expenseDate
    }
    return (
      !!form.value.planId && !!form.value.categoryId && !!form.value.name && !!form.value.amount
    )
  })

  const showBackButton = computed(() => {
    return currentMode.value === 'quick-select' && quickSelectPhase.value === 'finalize'
  })

  async function loadPlanItems(planId: string) {
    isLoadingPlanItems.value = true
    try {
      const items = await getPlanItems(planId)
      planItems.value = items.filter((item) => !(item.is_completed ?? false))
    } catch {
      notificationStore.showError('Failed to load plan items')
      planItems.value = []
    } finally {
      isLoadingPlanItems.value = false
    }
  }

  async function onPlanSelected(
    planId: string | null,
    planItemSelectorRef?: { clearSelection: () => void },
  ) {
    form.value.categoryId = null
    selectedPlanItems.value = []
    planItems.value = []
    quickSelectPhase.value = 'selection'

    if (planId) {
      await Promise.all([expensesStore.loadExpenseSummaryForPlan(planId), loadPlanItems(planId)])
    }

    if (planItemSelectorRef?.clearSelection) {
      planItemSelectorRef.clearSelection()
    }
  }

  function onItemsSelected(items: PlanItem[]) {
    selectedPlanItems.value = items
  }

  function onSelectionChanged(items: PlanItem[]) {
    selectedPlanItems.value = items
  }

  function goBackToSelection() {
    quickSelectPhase.value = 'selection'
  }

  function proceedToFinalize() {
    if (selectedPlanItems.value.length === 0) {
      notificationStore.showError('Please select at least one item to continue')
      return
    }
    quickSelectPhase.value = 'finalize'
  }

  function removeSelectedItem(
    itemId: string,
    planItemSelectorRef?: { deselectItem: (id: string) => void },
  ) {
    selectedPlanItems.value = selectedPlanItems.value.filter((item) => item.id !== itemId)

    if (planItemSelectorRef?.deselectItem) {
      planItemSelectorRef.deselectItem(itemId)
    }

    if (selectedPlanItems.value.length === 0) {
      quickSelectPhase.value = 'selection'
      notificationStore.showInfo('All items removed. Please select items to continue.')
    }
  }

  function resetForm() {
    form.value = {
      planId: null,
      categoryId: null,
      name: '',
      amount: null,
      expenseDate: new Date().toISOString().split('T')[0]!,
      planItemId: null,
    }
    didAutoSelectPlan.value = false
    selectedPlanItems.value = []
    planItems.value = []
    currentMode.value = 'quick-select'
    quickSelectPhase.value = 'selection'
  }

  async function handleQuickSelectSubmit(onSuccess: () => void) {
    if (selectedPlanItems.value.length === 0) {
      notificationStore.showError('Please select at least one item')
      return
    }

    if (!form.value.expenseDate) {
      notificationStore.showError('Please select an expense date')
      return
    }

    try {
      const expensePromises = selectedPlanItems.value.map(async (item) => {
        return expensesStore.addExpense({
          plan_id: item.plan_id,
          category_id: item.category_id,
          name: item.name,
          amount: item.amount,
          expense_date: form.value.expenseDate,
          plan_item_id: item.id,
        })
      })

      await Promise.all(expensePromises)

      const completionPromises = selectedPlanItems.value.map(async (item) => {
        return updatePlanItemCompletion(item.id, true)
      })

      await Promise.all(completionPromises)

      const count = selectedPlanItems.value.length
      notificationStore.showSuccess(
        `${count} expense${count !== 1 ? 's' : ''} registered successfully!`,
      )

      onSuccess()
    } catch (error) {
      console.error('Error registering expenses:', error)
      notificationStore.showError('Failed to register expenses. Please try again.')
    }
  }

  async function handleCustomEntrySubmit(isFormValid: boolean, onSuccess: () => void) {
    if (!isFormValid) {
      notificationStore.showError('Please fix the form errors before submitting')
      return
    }

    if (!form.value.planId || !form.value.categoryId || !form.value.amount) {
      notificationStore.showError('Please fill in all required fields')
      return
    }

    try {
      await expensesStore.addExpense({
        plan_id: form.value.planId,
        category_id: form.value.categoryId,
        name: form.value.name.trim(),
        amount: form.value.amount,
        expense_date: form.value.expenseDate,
        plan_item_id: form.value.planItemId || null,
      })

      if (form.value.planItemId) {
        await updatePlanItemCompletion(form.value.planItemId, true)
      }

      notificationStore.showSuccess('Expense registered successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error registering expense:', error)
      notificationStore.showError('Failed to register expense. Please try again.')
    }
  }

  async function initialize(autoSelectRecentPlan: boolean) {
    console.log('initialize', defaultPlanId?.value)
    await Promise.all([plansStore.loadPlans(), categoriesStore.loadCategories()])
    resetForm()

    if (defaultPlanId?.value) {
      form.value.planId = defaultPlanId.value
      await Promise.all([
        expensesStore.loadExpenseSummaryForPlan(defaultPlanId.value),
        loadPlanItems(defaultPlanId.value),
      ])
    } else if (autoSelectRecentPlan && mostRecentlyUsedPlan.value) {
      form.value.planId = mostRecentlyUsedPlan.value.id
      didAutoSelectPlan.value = true
      await Promise.all([
        expensesStore.loadExpenseSummaryForPlan(mostRecentlyUsedPlan.value.id),
        loadPlanItems(mostRecentlyUsedPlan.value.id),
      ])
    }
  }

  function determineInitialMode() {
    if (form.value.planId) {
      setTimeout(() => {
        currentMode.value = planItems.value.length > 0 ? 'quick-select' : 'custom-entry'
        if (currentMode.value === 'quick-select') {
          quickSelectPhase.value = 'selection'
        }
      }, 100)
    }
  }

  return {
    form,
    isLoading,
    isLoadingPlanItems,
    didAutoSelectPlan,
    currentMode,
    quickSelectPhase,
    planItems,
    selectedPlanItems,
    mostRecentlyUsedPlan,
    planOptions,
    selectedPlan,
    planDisplayValue,
    categoryOptions,
    selectedItemsTotal,
    budgetWarning,
    nameRules,
    amountRules,
    getSubmitButtonLabel,
    canSubmit,
    showBackButton,
    loadPlanItems,
    onPlanSelected,
    onItemsSelected,
    onSelectionChanged,
    goBackToSelection,
    proceedToFinalize,
    removeSelectedItem,
    resetForm,
    handleQuickSelectSubmit,
    handleCustomEntrySubmit,
    initialize,
    determineInitialMode,
  }
}
