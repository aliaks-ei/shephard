import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import { useCategoriesQuery } from 'src/queries/categories'
import { useTemplatesQuery } from 'src/queries/templates'
import { useDeletePlanMutation } from 'src/queries/plans'
import { useUserStore } from 'src/stores/user'
import { usePlan } from 'src/composables/usePlan'
import { usePlanItems } from 'src/composables/usePlanItems'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import { useCategoryRefs } from 'src/composables/useCategoryRefs'
import { usePlanActions, type PlanSaveState } from 'src/composables/usePlanActions'
import { validateItemForm } from 'src/composables/useItemFormValidation'
import { usePlanOverview } from 'src/composables/usePlanOverview'
import { usePlanExport } from 'src/composables/usePlanExport'
import { calculateEndDate } from 'src/utils/plans'
import { formatDateInput } from 'src/utils/date'
import {
  getPlanSharedUsers,
  getTemplateWithItems,
  type TemplateWithItems,
  type PlanWithItems,
} from 'src/api'
import type { PlanItemUI } from 'src/types'
import { useNotificationEvents } from 'src/composables/useNotificationEvents'
import type { ExportFormat } from 'src/utils/export'

const SAVE_SUCCESS_RESET_MS = 4000

export function usePlanPageState() {
  const router = useRouter()
  const userStore = useUserStore()
  const { emitRemovalNotification } = useNotificationEvents()
  const userId = computed(() => userStore.userProfile?.id)
  const { categories } = useCategoriesQuery()
  const { templates, isPending: isTemplatesLoading } = useTemplatesQuery(userId)
  const deletePlanMutation = useDeletePlanMutation()

  const {
    currentPlan,
    isPlanLoading,
    isNewPlan,
    isOwner,
    isEditMode,
    canEditPlanData,
    planCurrency,
    createNewPlanWithItems,
    updateExistingPlanWithItems,
    loadPlan,
    cancelCurrentPlan,
  } = usePlan()

  const {
    planItems,
    totalAmount,
    hasItems,
    hasValidItems,
    hasDuplicateItems,
    planCategoryGroups,
    addPlanItem,
    updatePlanItem,
    removePlanItem,
    loadPlanItems,
    loadPlanItemsFromTemplate,
    getPlanItemsForSave,
  } = usePlanItems()

  const pageConfig = {
    entityName: 'Plan',
    entityNamePlural: 'Plans',
    listRoute: '/plans',
    listIcon: 'eva-calendar-outline',
  }

  const { pageTitle } = useDetailPageState(
    pageConfig,
    isNewPlan,
    computed(() => !isEditMode.value),
  )

  const { openDialog, closeDialog, getDialogState } = useEditablePage()
  const { categoryBudgets, sortedExpenses } = usePlanOverview(
    computed(() => currentPlan.value?.id ?? null),
    computed(() => currentPlan.value),
  )
  const { exportPlan } = usePlanExport(
    computed(() => currentPlan.value),
    categories,
    categoryBudgets,
    sortedExpenses,
  )

  const { lastAddedCategoryId, setCategoryRef, scrollToFirstInvalidField, resetLastAddedCategory } =
    useCategoryRefs(planItems)

  const formSectionRef = ref()
  const editTabRef = ref()
  const activeTab = ref('overview')
  const selectedTemplate = ref<TemplateWithItems | null>(null)
  const selectedTemplateOption = ref<string | null>(null)
  const allCategoriesExpanded = ref(false)
  const showCancelDialog = ref(false)
  const showDeleteDialog = ref(false)
  const selectedCategory = ref<{ categoryId: string; itemId?: string } | null>(null)
  const hasOpenedExpenseDialog = ref(false)
  const showExpenseDialog = ref(false)
  const saveState = ref<PlanSaveState>('idle')
  let saveStateResetTimer: ReturnType<typeof setTimeout> | null = null

  const form = ref({
    name: '',
    startDate: '',
    endDate: '',
  })

  const templateError = ref(false)
  const templateErrorMessage = ref('')

  const templateOptions = computed(() => {
    return templates.value.map((template) => ({
      id: template.id,
      name: template.name,
      duration: template.duration,
      total: template.total ?? 0,
      currency: template.currency ?? 'EUR',
      permission_level: template.permission_level ?? 'owner',
    }))
  })

  const currentPlanTemplateDuration = computed(() => {
    if (!currentPlan.value?.template_id) return ''
    const template = templates.value.find((t) => t.id === currentPlan.value?.template_id)
    return template?.duration || ''
  })

  const isShareDialogOpen = computed({
    get: () => getDialogState('share'),
    set: (value: boolean) => (value ? openDialog('share') : closeDialog('share')),
  })

  const isExportDialogOpen = computed({
    get: () => getDialogState('export'),
    set: (value: boolean) => (value ? openDialog('export') : closeDialog('export')),
  })

  const { actionBarActions, actionsVisible } = usePlanActions({
    isNewPlan,
    isOwner,
    isEditMode,
    canEditPlanData,
    currentPlan,
    currentTab: activeTab,
    saveState,
    handlers: {
      onSave: () => {
        void handleSavePlan()
      },
      onShare: () => openDialog('share'),
      onCancel: () => {
        showCancelDialog.value = true
      },
      onDelete: () => {
        showDeleteDialog.value = true
      },
      onExport: () => openDialog('export'),
      onAddExpense: openExpenseRegistration,
      onSwitchToEdit: () => {
        activeTab.value = 'edit'
      },
    },
  })

  async function onTemplateSelected(templateId: string | null): Promise<void> {
    clearSaveFeedback()
    clearTemplateError()

    if (!templateId) {
      selectedTemplate.value = null
      selectedTemplateOption.value = null
      return
    }

    const template = userId.value ? await getTemplateWithItems(templateId, userId.value) : null

    if (template) {
      selectedTemplate.value = template
      selectedTemplateOption.value = templateId
      form.value.name = `${template.name} Plan`

      loadPlanItemsFromTemplate(template.template_items)

      if (!form.value.startDate) {
        form.value.startDate = formatDateInput(new Date())
      }

      if (form.value.startDate && template.duration) {
        const startDate = new Date(form.value.startDate)
        if (!isNaN(startDate.getTime())) {
          const endDate = calculateEndDate(
            startDate,
            template.duration as 'weekly' | 'monthly' | 'yearly',
          )
          form.value.endDate = formatDateInput(endDate)
        }
      }
    }
  }

  function handleUpdateItem(itemId: string, updatedItem: PlanItemUI): void {
    clearSaveFeedback()
    updatePlanItem(itemId, updatedItem)
  }

  function handleRemoveItem(itemId: string): void {
    clearSaveFeedback()
    removePlanItem(itemId)
  }

  function handleAddItem(categoryId: string, categoryColor: string): void {
    clearSaveFeedback()
    addPlanItem(categoryId, categoryColor)
  }

  async function handleSavePlan(): Promise<void> {
    resetLastAddedCategory()
    clearTemplateError()

    const formRef = isNewPlan.value ? formSectionRef.value?.formRef : editTabRef.value?.formRef

    const validationResult = await validateItemForm({
      formRef: ref(formRef),
      hasItems: hasItems.value,
      hasValidItems: hasValidItems.value,
      hasDuplicateItems: hasDuplicateItems.value,
      customValidation: () => {
        if (isNewPlan.value && !selectedTemplate.value) {
          templateError.value = true
          templateErrorMessage.value = 'Please select a template'
          return { isValid: false }
        }
        return { isValid: true }
      },
      scrollToFirstInvalid: scrollToFirstInvalidField,
      onExpandCategories: () => {
        allCategoriesExpanded.value = true
        nextTick()
      },
    })

    if (!validationResult.isValid) return

    clearSaveResetTimer()
    saveState.value = 'saving'
    await savePlan()
  }

  async function savePlan(): Promise<void> {
    const planItemsForSave = getPlanItemsForSave()
    const result = isNewPlan.value
      ? await createNewPlanWithItems(
          selectedTemplate.value!.id,
          form.value.name,
          form.value.startDate,
          form.value.endDate,
          totalAmount.value,
          planItemsForSave,
        )
      : await updateExistingPlanWithItems(
          form.value.name,
          form.value.startDate,
          form.value.endDate,
          totalAmount.value,
          planItemsForSave,
        )

    if (result.success) {
      if (isNewPlan.value) {
        router.push({ name: 'plans' })
      } else if (result.data) {
        saveState.value = 'saved'
        scheduleSaveFeedbackReset()
        router.push({ name: 'plan', params: { id: result.data.id } })
      }
      return
    }

    saveState.value = 'idle'
  }

  async function cancelPlan(): Promise<void> {
    const result = await cancelCurrentPlan()

    if (result.success) {
      showCancelDialog.value = false
      goBack()
    }
  }

  async function deletePlan(): Promise<void> {
    if (!currentPlan.value) return

    await emitRemovalNotification('plan', currentPlan.value.id, currentPlan.value.name, () =>
      getPlanSharedUsers(currentPlan.value!.id),
    )

    await deletePlanMutation.mutateAsync(currentPlan.value.id)
    showDeleteDialog.value = false
    goBack()
  }

  function onPlanShared(): void {
    closeDialog('share')
  }

  function toggleAllCategories(): void {
    allCategoriesExpanded.value = !allCategoriesExpanded.value
  }

  function goBack(): void {
    router.push({ name: 'plans' })
  }

  function clearTemplateError(): void {
    templateError.value = false
    templateErrorMessage.value = ''
  }

  function handlePlanExport(format: ExportFormat): void {
    const didExport = exportPlan(format)

    if (didExport) {
      closeDialog('export')
    }
  }

  function clearSaveFeedback(): void {
    if (saveState.value !== 'saved') {
      return
    }

    clearSaveResetTimer()
    saveState.value = 'idle'
  }

  function clearSaveResetTimer(): void {
    if (!saveStateResetTimer) {
      return
    }

    clearTimeout(saveStateResetTimer)
    saveStateResetTimer = null
  }

  function scheduleSaveFeedbackReset(): void {
    clearSaveResetTimer()
    saveStateResetTimer = setTimeout(() => {
      saveState.value = 'idle'
      saveStateResetTimer = null
    }, SAVE_SUCCESS_RESET_MS)
  }

  function openExpenseRegistration(): void {
    hasOpenedExpenseDialog.value = true
    selectedCategory.value = null
    showExpenseDialog.value = true
  }

  function openExpenseRegistrationFromCategory(categoryId?: string): void {
    hasOpenedExpenseDialog.value = true
    selectedCategory.value = categoryId ? { categoryId } : null
    showExpenseDialog.value = true
  }

  function openExpenseRegistrationFromItem(categoryId?: string, itemId?: string): void {
    hasOpenedExpenseDialog.value = true
    selectedCategory.value = categoryId ? { categoryId, ...(itemId && { itemId }) } : null
    showExpenseDialog.value = true
  }

  async function refreshPlanData(): Promise<void> {
    if (!isNewPlan.value) {
      const plan = await loadPlan()
      if (plan) {
        syncFormFromPlan(plan)
      }
    }
  }

  function syncFormFromPlan(plan: PlanWithItems): void {
    form.value.name = plan.name
    form.value.startDate = plan.start_date
    form.value.endDate = plan.end_date
    loadPlanItems(plan)
  }

  onMounted(async () => {
    if (!isNewPlan.value) {
      const plan = await loadPlan()
      if (plan) {
        syncFormFromPlan(plan)
      }
    }
  })

  watch(
    () => [form.value.name, form.value.startDate, form.value.endDate],
    () => {
      clearSaveFeedback()
    },
  )

  onUnmounted(() => {
    clearSaveResetTimer()
  })

  return {
    currentPlan,
    isPlanLoading,
    isNewPlan,
    isOwner,
    isEditMode,
    planCurrency,
    categories,
    isTemplatesLoading,
    actionBarActions,
    actionsVisible,
    pageTitle,
    form,
    formSectionRef,
    editTabRef,
    activeTab,
    selectedTemplate,
    selectedTemplateOption,
    templateOptions,
    currentPlanTemplateDuration,
    allCategoriesExpanded,
    templateError,
    templateErrorMessage,
    planCategoryGroups,
    totalAmount,
    hasDuplicateItems,
    lastAddedCategoryId,
    setCategoryRef,
    isShareDialogOpen,
    isExportDialogOpen,
    showCancelDialog,
    showDeleteDialog,
    deletePlanMutation,
    hasOpenedExpenseDialog,
    showExpenseDialog,
    selectedCategory,
    saveState,
    handleSavePlan,
    onTemplateSelected,
    handlePlanExport,
    toggleAllCategories,
    handleUpdateItem,
    handleRemoveItem,
    handleAddItem,
    goBack,
    onPlanShared,
    cancelPlan,
    deletePlan,
    refreshPlanData,
    openExpenseRegistrationFromCategory,
    openExpenseRegistrationFromItem,
  }
}
