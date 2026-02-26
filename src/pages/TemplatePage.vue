<template>
  <BaseItemFormPage
    :page-title="pageTitle"
    :is-loading="isTemplateLoading"
    :actions="actionBarActions"
    :actions-visible="isEditMode"
    :is-edit-mode="isEditMode"
    :show-read-only-badge="!isEditMode"
    @back="goBack"
  >
    <TemplateEditView
      v-if="isEditMode"
      ref="editViewRef"
      v-model:form="form"
      :category-groups="categoryGroups"
      :categories="categories"
      :total-amount="totalAmount"
      :currency="templateCurrency"
      :all-expanded="allCategoriesExpanded"
      :has-duplicates="hasDuplicateItems"
      :name-error="nameError"
      :name-error-message="nameErrorMessage"
      :last-added-category-id="lastAddedCategoryId"
      :set-category-ref="setCategoryRef"
      @submit="saveTemplate"
      @clear-name-error="clearNameError"
      @toggle-expand="toggleAllCategories"
      @open-category-dialog="openCategoryDialog"
      @update-item="updateTemplateItem"
      @remove-item="removeTemplateItem"
      @add-item="handleAddTemplateItem"
    />

    <TemplateReadOnlyView
      v-else
      :form="form"
      :category-groups="categoryGroups"
      :categories="categories"
      :total-amount="totalAmount"
      :currency="templateCurrency"
      :all-expanded="allCategoriesExpanded"
      @toggle-expand="toggleAllCategories"
    />

    <template #dialogs>
      <!-- Dialogs -->
      <CategorySelectionDialog
        v-model="showCategoryDialog"
        :used-category-ids="getUsedCategoryIds()"
        :categories="categories"
        @category-selected="onCategorySelected"
      />

      <ShareTemplateDialog
        v-if="routeTemplateId"
        v-model="isShareDialogOpen"
        :template-id="routeTemplateId"
        :owner-user-id="currentTemplate?.owner_id"
        @shared="onTemplateShared"
      />

      <DeleteDialog
        v-if="!isNewTemplate"
        v-model="showDeleteDialog"
        title="Delete Template"
        warning-message="This will permanently delete your template and all its data. This action cannot be undone."
        :confirmation-message="`Are you sure you want to delete this template?`"
        cancel-label="Keep Template"
        confirm-label="Delete Template"
        :is-deleting="deleteTemplateMutation.isPending.value"
        @confirm="deleteTemplate"
      />
    </template>
  </BaseItemFormPage>
</template>

<script setup lang="ts">
import BaseItemFormPage from 'src/layouts/BaseItemFormPage.vue'
import TemplateEditView from 'src/components/templates/TemplateEditView.vue'
import TemplateReadOnlyView from 'src/components/templates/TemplateReadOnlyView.vue'
import CategorySelectionDialog from 'src/components/categories/CategorySelectionDialog.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import { useTemplatePageState } from 'src/composables/useTemplatePageState'

const {
  currentTemplate,
  isTemplateLoading,
  isNewTemplate,
  routeTemplateId,
  isEditMode,
  templateCurrency,
  categories,
  pageTitle,
  categoryGroups,
  totalAmount,
  hasDuplicateItems,
  nameError,
  nameErrorMessage,
  lastAddedCategoryId,
  setCategoryRef,
  editViewRef,
  form,
  allCategoriesExpanded,
  actionBarActions,
  showCategoryDialog,
  isShareDialogOpen,
  showDeleteDialog,
  deleteTemplateMutation,
  getUsedCategoryIds,
  updateTemplateItem,
  removeTemplateItem,
  handleAddTemplateItem,
  saveTemplate,
  clearNameError,
  onCategorySelected,
  openCategoryDialog,
  toggleAllCategories,
  goBack,
  onTemplateShared,
  deleteTemplate,
} = useTemplatePageState()
</script>
