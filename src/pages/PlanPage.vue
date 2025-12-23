<template>
  <BaseItemFormPage
    :page-title="pageTitle"
    :is-loading="isPlanLoading"
    :actions="actionBarActions"
    :actions-visible="actionsVisible"
    :is-edit-mode="isEditMode"
    :show-read-only-badge="!isEditMode"
    @back="goBack"
  >
    <PlanFormSection
      v-if="isNewPlan"
      ref="formSectionRef"
      v-model:form="form"
      :selected-template="selectedTemplate"
      v-model:selectedTemplateOption="selectedTemplateOption"
      :template-options="templateOptions"
      :templates-loading="templatesStore.isLoading"
      :template-error="templateError"
      :template-error-message="templateErrorMessage"
      :category-groups="planCategoryGroups"
      :categories="categoriesStore.categories"
      :total-amount="totalAmount"
      :currency="planCurrency"
      :all-expanded="allCategoriesExpanded"
      :has-duplicates="hasDuplicateItems"
      :last-added-category-id="lastAddedCategoryId"
      :set-category-ref="setCategoryRef"
      @submit="handleSavePlan"
      @template-selected="onTemplateSelected"
      @toggle-expand="toggleAllCategories"
      @update-item="handleUpdateItem"
      @remove-item="handleRemoveItem"
      @add-item="handleAddItem"
    />

    <div v-else-if="!isNewPlan">
      <q-tabs
        v-model="activeTab"
        :dense="$q.screen.lt.md"
        no-caps
        inline-label
        align="justify"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab
          name="overview"
          label="Overview"
          icon="eva-pie-chart-outline"
        />
        <q-tab
          v-if="isEditMode"
          name="items"
          label="Items"
          icon="eva-checkmark-square-2-outline"
        />
        <q-tab
          v-if="isEditMode"
          name="edit"
          label="Edit"
          icon="eva-edit-outline"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="activeTab"
        animated
        :swipeable="$q.screen.lt.md"
        :transition-prev="$q.screen.lt.md ? 'slide-right' : 'fade'"
        :transition-next="$q.screen.lt.md ? 'slide-left' : 'fade'"
        class="q-mt-md bg-transparent"
      >
        <q-tab-panel
          class="q-pa-none q-pa-md-sm"
          name="overview"
        >
          <PlanOverviewTab
            :plan="currentPlan"
            :is-owner="isOwner"
            :is-edit-mode="isEditMode"
            @refresh="refreshPlanData"
            @open-expense-dialog="openExpenseRegistrationFromCategory"
            @view-items="activeTab = 'items'"
          />
        </q-tab-panel>

        <q-tab-panel
          v-if="isEditMode"
          class="q-pa-none q-pa-md-sm"
          name="items"
        >
          <PlanItemsTrackingTab
            :plan="currentPlan"
            :can-edit="isEditMode"
            :currency="planCurrency"
            @add-expense="openExpenseRegistrationFromItem"
            @refresh="refreshPlanData"
          />
        </q-tab-panel>

        <q-tab-panel
          v-if="isEditMode"
          class="q-pa-none q-pa-md-sm"
          name="edit"
        >
          <PlanEditTab
            ref="editTabRef"
            v-model:form="form"
            :template-duration="currentPlanTemplateDuration"
            :category-groups="planCategoryGroups"
            :categories="categoriesStore.categories"
            :total-amount="totalAmount"
            :currency="planCurrency"
            :all-expanded="allCategoriesExpanded"
            :has-duplicates="hasDuplicateItems"
            :last-added-category-id="lastAddedCategoryId"
            :set-category-ref="setCategoryRef"
            @submit="handleSavePlan"
            @toggle-expand="toggleAllCategories"
            @update-item="handleUpdateItem"
            @remove-item="handleRemoveItem"
            @add-item="handleAddItem"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <template #dialogs>
      <!-- Dialogs -->
      <SharePlanDialog
        v-if="currentPlan"
        v-model="isShareDialogOpen"
        :plan-id="currentPlan.id"
        @shared="onPlanShared"
      />

      <DeleteDialog
        v-model="showCancelDialog"
        title="Cancel Plan"
        warning-message="This will mark the plan as cancelled and stop any active tracking."
        :confirmation-message="`Are you sure you want to cancel &quot;${form.name}&quot;?`"
        cancel-label="Keep Active"
        confirm-label="Cancel Plan"
        @confirm="cancelPlan"
      />

      <DeleteDialog
        v-if="showDeleteDialog"
        v-model="showDeleteDialog"
        title="Delete Plan"
        warning-message="This will permanently delete your plan and all its data. This action cannot be undone."
        :confirmation-message="`Are you sure you want to delete this plan?`"
        cancel-label="Keep Plan"
        confirm-label="Delete Plan"
        :is-deleting="plansStore.isLoading"
        @confirm="deletePlan"
      />

      <ExpenseRegistrationDialog
        v-if="currentPlan && !isNewPlan"
        v-model="showExpenseDialog"
        :default-plan-id="currentPlan.id"
        :default-category-id="selectedCategory?.categoryId || null"
        @expense-created="refreshPlanData"
      />
    </template>
  </BaseItemFormPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

import BaseItemFormPage from 'src/layouts/BaseItemFormPage.vue'
import PlanFormSection from 'src/components/plans/PlanFormSection.vue'
import PlanEditTab from 'src/components/plans/PlanEditTab.vue'
import PlanOverviewTab from 'src/components/plans/PlanOverviewTab.vue'
import PlanItemsTrackingTab from 'src/components/plans/PlanItemsTrackingTab.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { usePlansStore } from 'src/stores/plans'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { useTemplatesStore } from 'src/stores/templates'
import { useExpensesStore } from 'src/stores/expenses'
import { usePlan } from 'src/composables/usePlan'
import { usePlanItems } from 'src/composables/usePlanItems'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import { useCategoryRefs } from 'src/composables/useCategoryRefs'
import { usePlanActions } from 'src/composables/usePlanActions'
import { validateItemForm } from 'src/composables/useItemFormValidation'
import { calculateEndDate } from 'src/utils/plans'
import type { TemplateWithItems } from 'src/api'
import type { PlanItemUI } from 'src/types'

const $q = useQuasar()
const router = useRouter()
const plansStore = usePlansStore()
const categoriesStore = useCategoriesStore()
const notificationsStore = useNotificationStore()
const templatesStore = useTemplatesStore()
const expensesStore = useExpensesStore()

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

const { pageTitle } = useDetailPageState(pageConfig, isNewPlan.value, !isEditMode.value)

const { openDialog, closeDialog, getDialogState } = useEditablePage()

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
const showExpenseDialog = ref(false)

const form = ref({
  name: '',
  startDate: '',
  endDate: '',
})

const templateError = ref(false)
const templateErrorMessage = ref('')

const templateOptions = computed(() => {
  return templatesStore.templates.map((template) => ({
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
  const template = templatesStore.templates.find((t) => t.id === currentPlan.value?.template_id)
  return template?.duration || ''
})

const isShareDialogOpen = computed({
  get: () => getDialogState('share'),
  set: (value: boolean) => (value ? openDialog('share') : closeDialog('share')),
})

const { actionBarActions, actionsVisible } = usePlanActions({
  isNewPlan,
  isOwner,
  isEditMode,
  canEditPlanData,
  currentPlan,
  currentTab: activeTab,
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
    onAddExpense: openExpenseRegistration,
    onSwitchToEdit: () => {
      activeTab.value = 'edit'
    },
  },
})

async function onTemplateSelected(templateId: string | null): Promise<void> {
  clearTemplateError()

  if (!templateId) {
    selectedTemplate.value = null
    selectedTemplateOption.value = null
    return
  }

  const template = await templatesStore.loadTemplateWithItems(templateId)

  if (template) {
    selectedTemplate.value = template
    selectedTemplateOption.value = templateId
    form.value.name = `${template.name} Plan`

    loadPlanItemsFromTemplate(template.template_items)

    if (!form.value.startDate) {
      form.value.startDate = new Date().toISOString().split('T')[0] || ''
    }

    // Calculate end date based on template duration and start date
    if (form.value.startDate && template.duration) {
      const startDate = new Date(form.value.startDate)
      if (!isNaN(startDate.getTime())) {
        const endDate = calculateEndDate(
          startDate,
          template.duration as 'weekly' | 'monthly' | 'yearly',
        )
        form.value.endDate = endDate.toISOString().split('T')[0] || ''
      }
    }
  }
}

function handleUpdateItem(itemId: string, updatedItem: PlanItemUI): void {
  updatePlanItem(itemId, updatedItem)
}

function handleRemoveItem(itemId: string): void {
  removePlanItem(itemId)
}

function handleAddItem(categoryId: string, categoryColor: string): void {
  addPlanItem(categoryId, categoryColor)
}

async function handleSavePlan(): Promise<void> {
  resetLastAddedCategory()
  clearTemplateError()

  const formRef = isNewPlan.value ? formSectionRef.value?.formRef : editTabRef.value?.formRef

  const validationResult = await validateItemForm({
    formRef: ref(formRef),
    hasValidItems: hasValidItems.value,
    hasDuplicateItems: hasDuplicateItems.value,
    customValidation: () => {
      if (isNewPlan.value && !selectedTemplate.value) {
        templateError.value = true
        templateErrorMessage.value = 'Please select a template'
        notificationsStore.showError('Please select a template before creating the plan')
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
    notificationsStore.showSuccess(
      isNewPlan.value ? 'Plan created successfully' : 'Plan updated successfully',
    )

    if (isNewPlan.value) {
      router.push({ name: 'plans' })
    } else if (result.data) {
      router.push({ name: 'plan', params: { id: result.data.id } })
    }
  }
}

async function cancelPlan(): Promise<void> {
  const result = await cancelCurrentPlan()

  if (result.success) {
    showCancelDialog.value = false
    notificationsStore.showSuccess('Plan cancelled successfully')
    goBack()
  }
}

async function deletePlan(): Promise<void> {
  if (!currentPlan.value) return

  const result = await plansStore.removePlan(currentPlan.value.id)

  if (result.success) {
    showDeleteDialog.value = false
    notificationsStore.showSuccess('Plan deleted successfully')
    goBack()
  }
}

function onPlanShared(): void {
  notificationsStore.showSuccess('Plan shared successfully')
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

function openExpenseRegistration(): void {
  selectedCategory.value = null
  showExpenseDialog.value = true
}

function openExpenseRegistrationFromCategory(categoryId?: string): void {
  selectedCategory.value = categoryId ? { categoryId } : null
  showExpenseDialog.value = true
}

function openExpenseRegistrationFromItem(categoryId?: string, itemId?: string): void {
  selectedCategory.value = categoryId ? { categoryId, ...(itemId && { itemId }) } : null
  showExpenseDialog.value = true
}

async function loadPlanExpenses(planId: string): Promise<void> {
  await Promise.all([
    expensesStore.loadExpensesForPlan(planId),
    expensesStore.loadExpenseSummaryForPlan(planId),
  ])
}

async function refreshPlanData(): Promise<void> {
  if (!isNewPlan.value && currentPlan.value) {
    const plan = await loadPlan()
    if (plan) {
      form.value.name = plan.name
      form.value.startDate = plan.start_date
      form.value.endDate = plan.end_date
      loadPlanItems(plan)

      await loadPlanExpenses(currentPlan.value.id)
    }
  }
}

onMounted(async () => {
  if (!isNewPlan.value) {
    isPlanLoading.value = true
  }

  try {
    await categoriesStore.loadCategories()

    if (isNewPlan.value) {
      await templatesStore.loadTemplates()
    } else {
      const plan = await loadPlan()
      if (plan) {
        form.value.name = plan.name
        form.value.startDate = plan.start_date
        form.value.endDate = plan.end_date
        loadPlanItems(plan)

        await loadPlanExpenses(plan.id)
      }
    }
  } finally {
    if (!isNewPlan.value) {
      isPlanLoading.value = false
    }
  }
})
</script>
