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
      :templates-loading="isTemplatesLoading"
      :template-error="templateError"
      :template-error-message="templateErrorMessage"
      :category-groups="planCategoryGroups"
      :categories="categories"
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
            :categories="categories"
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
        :owner-user-id="currentPlan.owner_id"
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
        :is-deleting="deletePlanMutation.isPending.value"
        @confirm="deletePlan"
      />

      <ExpenseRegistrationDialog
        v-if="currentPlan && !isNewPlan && hasOpenedExpenseDialog"
        v-model="showExpenseDialog"
        :default-plan-id="currentPlan.id"
        :default-category-id="selectedCategory?.categoryId || null"
        @expense-created="refreshPlanData"
      />
    </template>
  </BaseItemFormPage>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'

import BaseItemFormPage from 'src/layouts/BaseItemFormPage.vue'
import PlanFormSection from 'src/components/plans/PlanFormSection.vue'
import PlanEditTab from 'src/components/plans/PlanEditTab.vue'
import PlanOverviewTab from 'src/components/plans/PlanOverviewTab.vue'
import PlanItemsTrackingTab from 'src/components/plans/PlanItemsTrackingTab.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import { usePlanPageState } from 'src/composables/usePlanPageState'

const ExpenseRegistrationDialog = defineAsyncComponent(
  () => import('src/components/expenses/ExpenseRegistrationDialog.vue'),
)

const $q = useQuasar()
const {
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
  showCancelDialog,
  showDeleteDialog,
  deletePlanMutation,
  hasOpenedExpenseDialog,
  showExpenseDialog,
  selectedCategory,
  handleSavePlan,
  onTemplateSelected,
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
} = usePlanPageState()
</script>
