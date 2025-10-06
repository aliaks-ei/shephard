<template>
  <BaseItemFormPage
    :page-title="pageTitle"
    :page-icon="pageIcon"
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
      :categories="categoriesStore.categories"
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
      @open-category-dialog="openDialog('category')"
      @update-item="updateTemplateItem"
      @remove-item="removeTemplateItem"
      @add-item="handleAddTemplateItem"
    />

    <TemplateReadOnlyView
      v-else
      :form="form"
      :category-groups="categoryGroups"
      :categories="categoriesStore.categories"
      :total-amount="totalAmount"
      :currency="templateCurrency"
      :all-expanded="allCategoriesExpanded"
      @toggle-expand="toggleAllCategories"
    />

    <template #dialogs>
      <!-- Lazy Loaded Dialogs -->
      <component
        :is="CategorySelectionDialog"
        v-if="showCategoryDialog"
        v-model="showCategoryDialog"
        :used-category-ids="getUsedCategoryIds()"
        :categories="categoriesStore.categories"
        @category-selected="onCategorySelected"
      />

      <component
        :is="ShareTemplateDialog"
        v-if="isShareDialogOpen && routeTemplateId"
        v-model="isShareDialogOpen"
        :template-id="routeTemplateId"
        @shared="onTemplateShared"
      />

      <component
        :is="DeleteDialog"
        v-if="showDeleteDialog && !isNewTemplate"
        v-model="showDeleteDialog"
        title="Delete Template"
        warning-message="This will permanently delete your template and all its data. This action cannot be undone."
        :confirmation-message="`Are you sure you want to delete this template?`"
        cancel-label="Keep Template"
        confirm-label="Delete Template"
        :is-deleting="templatesStore.isLoading"
        @confirm="deleteTemplate"
      />
    </template>
  </BaseItemFormPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'

import BaseItemFormPage from 'src/layouts/BaseItemFormPage.vue'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'
import TemplateEditView from 'src/components/templates/TemplateEditView.vue'
import TemplateReadOnlyView from 'src/components/templates/TemplateReadOnlyView.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { useTemplateItems } from 'src/composables/useTemplateItems'
import { useTemplate } from 'src/composables/useTemplate'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import { useCategoryRefs } from 'src/composables/useCategoryRefs'
import { validateItemForm } from 'src/composables/useItemFormValidation'
import type { Category } from 'src/api'

const CategorySelectionDialog = defineAsyncComponent(
  () => import('src/components/categories/CategorySelectionDialog.vue'),
)
const ShareTemplateDialog = defineAsyncComponent(
  () => import('src/components/templates/ShareTemplateDialog.vue'),
)
const DeleteDialog = defineAsyncComponent(() => import('src/components/shared/DeleteDialog.vue'))

const router = useRouter()
const templatesStore = useTemplatesStore()
const categoriesStore = useCategoriesStore()
const notificationsStore = useNotificationStore()

const {
  isTemplateLoading,
  isNewTemplate,
  routeTemplateId,
  isOwner,
  isEditMode,
  templateCurrency,
  createNewTemplateWithItems,
  updateExistingTemplateWithItems,
  loadTemplate,
} = useTemplate()

const {
  templateItems,
  totalAmount,
  hasValidItems,
  hasDuplicateItems,
  categoryGroups,
  addTemplateItem,
  updateTemplateItem,
  removeTemplateItem,
  loadTemplateItems,
  getTemplateItemsForSave,
  getUsedCategoryIds,
} = useTemplateItems()

const pageConfig = {
  entityName: 'Template',
  entityNamePlural: 'Templates',
  listRoute: '/templates',
  listIcon: 'eva-grid-outline',
  createIcon: 'eva-plus-circle-outline',
  editIcon: 'eva-edit-outline',
  viewIcon: 'eva-eye-outline',
}

const { pageTitle, pageIcon } = useDetailPageState(
  pageConfig,
  isNewTemplate.value,
  !isEditMode.value,
)

const { openDialog, closeDialog, getDialogState } = useEditablePage()

const {
  lastAddedCategoryId,
  setCategoryRef,
  focusLastItemInCategory,
  scrollToFirstInvalidField,
  resetLastAddedCategory,
} = useCategoryRefs(templateItems)

const editViewRef = ref()
const allCategoriesExpanded = ref(false)
const showDeleteDialog = ref(false)
const form = ref({
  name: '',
  duration: 'monthly' as string,
})

const nameError = ref(false)
const nameErrorMessage = ref('')

const showCategoryDialog = computed({
  get: () => getDialogState('category'),
  set: (value: boolean) => (value ? openDialog('category') : closeDialog('category')),
})

const isShareDialogOpen = computed({
  get: () => getDialogState('share'),
  set: (value: boolean) => (value ? openDialog('share') : closeDialog('share')),
})

const actionBarActions = computed<ActionBarAction[]>(() => [
  {
    key: 'add-category',
    icon: 'eva-plus-outline',
    label: 'Category',
    color: 'primary',
    priority: 'primary',
    visible: isEditMode.value,
    handler: () => openDialog('category'),
  },
  {
    key: 'save',
    icon: 'eva-save-outline',
    label: isNewTemplate.value ? 'Create' : 'Save',
    color: isNewTemplate.value ? 'primary' : 'positive',
    priority: 'primary',
    loading: templatesStore.isLoading,
    handler: saveTemplate,
  },
  {
    key: 'share',
    icon: 'eva-share-outline',
    label: 'Share',
    color: 'info',
    priority: 'secondary',
    visible: !isNewTemplate.value && isOwner.value,
    handler: () => openDialog('share'),
  },
  {
    key: 'delete',
    icon: 'eva-trash-2-outline',
    label: 'Delete',
    color: 'negative',
    priority: 'secondary',
    visible: !isNewTemplate.value && isOwner.value,
    handler: () => {
      showDeleteDialog.value = true
    },
  },
])

async function handleAddTemplateItem(categoryId: string, categoryColor: string): Promise<void> {
  addTemplateItem(categoryId, categoryColor)

  await nextTick()
  focusLastItemInCategory(categoryId)
}

async function onCategorySelected(category: Category): Promise<void> {
  addTemplateItem(category.id, category.color || '#1976d2')
  lastAddedCategoryId.value = category.id
  closeDialog('category')

  await nextTick()
  focusLastItemInCategory(category.id)
}

function toggleAllCategories(): void {
  allCategoriesExpanded.value = !allCategoriesExpanded.value
  if (allCategoriesExpanded.value) {
    lastAddedCategoryId.value = null
  }
}

function goBack(): void {
  router.push({ name: 'templates' })
}

function clearNameError(): void {
  nameError.value = false
  nameErrorMessage.value = ''
}

async function saveTemplate(): Promise<void> {
  resetLastAddedCategory()
  clearNameError()

  const validationResult = await validateItemForm({
    formRef: editViewRef.value?.formRef ? ref(editViewRef.value.formRef) : ref(undefined),
    hasValidItems: hasValidItems.value,
    hasDuplicateItems: hasDuplicateItems.value,
    customValidation: () => {
      if (!form.value.name || form.value.name.trim().length === 0) {
        nameError.value = true
        nameErrorMessage.value = 'Template name is required'
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

  const templateItemsForSave = getTemplateItemsForSave()

  let result
  if (isNewTemplate.value) {
    result = await createNewTemplateWithItems(
      form.value.name.trim(),
      form.value.duration,
      totalAmount.value,
      templateItemsForSave,
    )
  } else {
    result = await updateExistingTemplateWithItems(
      form.value.name.trim(),
      form.value.duration,
      totalAmount.value,
      templateItemsForSave,
    )
  }

  if (result.success) {
    notificationsStore.showSuccess(
      isNewTemplate.value ? 'Template created successfully' : 'Template updated successfully',
    )
    goBack()
  }
}

async function loadCurrentTemplate(): Promise<void> {
  const template = await loadTemplate()

  if (!template) return

  form.value.name = template.name
  form.value.duration = template.duration

  loadTemplateItems(template)
}

async function deleteTemplate(): Promise<void> {
  if (!routeTemplateId.value) return

  const result = await templatesStore.removeTemplate(routeTemplateId.value)

  if (result.success) {
    showDeleteDialog.value = false
    notificationsStore.showSuccess('Template deleted successfully')
    goBack()
  }
}

function onTemplateShared(): void {
  notificationsStore.showSuccess('Template shared successfully')
  templatesStore.loadTemplates()
  closeDialog('share')
}

onMounted(async () => {
  isTemplateLoading.value = true

  try {
    await categoriesStore.loadCategories()
    await loadCurrentTemplate()
  } finally {
    isTemplateLoading.value = false
  }
})
</script>
