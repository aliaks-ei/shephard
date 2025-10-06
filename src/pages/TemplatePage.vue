<template>
  <DetailPageLayout
    :page-title="pageTitle"
    :page-icon="pageIcon"
    :banners="banners"
    :is-loading="isTemplateLoading"
    :actions="actionBarActions"
    :actions-visible="isEditMode"
    :show-read-only-badge="!isEditMode"
    @back="goBack"
  >
    <!-- Main Content -->
    <q-form
      v-if="isEditMode"
      ref="formRef"
      @submit="saveTemplate"
    >
      <!-- Basic Information Card -->
      <TemplateBasicInfoSection
        v-model="form"
        :name-error="nameError"
        :name-error-message="nameErrorMessage"
        @clear-name-error="clearNameError"
      />

      <!-- Categories Card -->
      <CategoryListSection
        header-icon="eva-grid-outline"
        header-title="Categories"
        :has-categories="templateItems.length > 0"
        :item-count="templateItems.length"
        :all-expanded="allCategoriesExpanded"
        :has-duplicates="hasDuplicateItems"
        duplicate-banner-position="top"
        :duplicate-banner-class="
          $q.dark.isActive ? 'bg-orange-9 text-orange-3' : 'bg-orange-1 text-orange-8'
        "
        show-item-count
        @toggle-expand="toggleAllCategories"
      >
        <template #header-actions>
          <q-btn
            v-if="!$q.screen.lt.md"
            icon="eva-plus-outline"
            label="Add category"
            color="primary"
            no-caps
            @click="openDialog('category')"
          />
        </template>

        <template #duplicate-message>
          You have duplicate item names within the same category. Please use unique names for each
          item.
        </template>

        <template #empty-state>
          <div class="text-center q-py-xl">
            <q-icon
              name="eva-grid-outline"
              size="4rem"
              class="text-grey-4 q-mb-md"
            />
            <div class="text-h6 q-mb-sm text-grey-6">No categories yet</div>
            <div class="text-body2 text-grey-5 q-mb-lg">
              Start building your template by adding named items with categories and amounts
            </div>
            <q-btn
              color="primary"
              icon="eva-plus-outline"
              label="Add Your First Category"
              unelevated
              no-caps
              @click="openDialog('category')"
            />
          </div>
        </template>

        <template #categories>
          <TemplateCategory
            v-for="group in enrichedCategories"
            :key="`${group.categoryId}-${allCategoriesExpanded}`"
            :ref="(el) => setCategoryRef(el, group.categoryId)"
            :category-id="group.categoryId"
            :category-name="group.categoryName"
            :category-color="group.categoryColor"
            :category-icon="group.categoryIcon"
            :items="group.items"
            :currency="templateCurrency"
            :readonly="false"
            :default-expanded="allCategoriesExpanded || group.categoryId === lastAddedCategoryId"
            @update-item="updateTemplateItem"
            @remove-item="removeTemplateItem"
            @add-item="handleAddTemplateItem"
          />
        </template>

        <template #summary>
          <ItemsSummarySection
            :formatted-amount="formattedTotalAmount"
            :item-count="enrichedCategories.length"
            item-type="categories"
            summary-label="Total Amount"
          />
        </template>
      </CategoryListSection>
    </q-form>

    <!-- Read-only view -->
    <div v-else>
      <!-- Basic Information Card -->
      <TemplateBasicInfoSection
        v-model="form"
        readonly
      />

      <!-- Categories Card -->
      <CategoryListSection
        header-icon="eva-grid-outline"
        header-title="Categories"
        :has-categories="templateItems.length > 0"
        :item-count="templateItems.length"
        :all-expanded="allCategoriesExpanded"
        :show-duplicate-warning="false"
        show-item-count
        @toggle-expand="toggleAllCategories"
      >
        <template #empty-state>
          <div class="text-center q-py-xl">
            <q-icon
              name="eva-grid-outline"
              size="4rem"
              class="text-grey-4 q-mb-md"
            />
            <div class="text-h6 q-mb-sm text-grey-6">No categories</div>
            <div class="text-body2 text-grey-5 q-mb-lg">
              This template doesn't have any items yet
            </div>
          </div>
        </template>

        <template #categories>
          <TemplateCategory
            v-for="group in enrichedCategories"
            :key="`${group.categoryId}-${allCategoriesExpanded}`"
            :category-id="group.categoryId"
            :category-name="group.categoryName"
            :category-color="group.categoryColor"
            :category-icon="group.categoryIcon"
            :items="group.items"
            :currency="templateCurrency"
            :default-expanded="allCategoriesExpanded"
            readonly
            @update-item="updateTemplateItem"
            @remove-item="removeTemplateItem"
          />
        </template>

        <template #summary>
          <ItemsSummarySection
            :formatted-amount="formattedTotalAmount"
            :item-count="templateItems.length"
            item-type="categories"
            amount-size-mobile="text-h5"
            amount-size-desktop="text-h4"
          />
        </template>
      </CategoryListSection>
    </div>

    <!-- Dialogs Slot -->
    <template #dialogs>
      <CategorySelectionDialog
        v-model="showCategoryDialog"
        :used-category-ids="getUsedCategoryIds()"
        :categories="categoriesStore.categories"
        @category-selected="onCategorySelected"
      />

      <ShareTemplateDialog
        v-if="routeTemplateId"
        v-model="isShareDialogOpen"
        :template-id="routeTemplateId"
        @shared="onTemplateShared"
      />

      <!-- Delete Template Dialog -->
      <DeleteDialog
        v-if="!isNewTemplate"
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
  </DetailPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { QForm } from 'quasar'

import DetailPageLayout from 'src/layouts/DetailPageLayout.vue'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'
import TemplateCategory from 'src/components/templates/TemplateCategory.vue'
import CategorySelectionDialog from 'src/components/categories/CategorySelectionDialog.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import CategoryListSection from 'src/components/shared/CategoryListSection.vue'
import ItemsSummarySection from 'src/components/shared/ItemsSummarySection.vue'
import TemplateBasicInfoSection from 'src/components/templates/TemplateBasicInfoSection.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { useTemplateItems } from 'src/composables/useTemplateItems'
import { formatCurrency } from 'src/utils/currency'
import { useTemplate } from 'src/composables/useTemplate'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import { useCategoryRefs } from 'src/composables/useCategoryRefs'
import type { Category } from 'src/api'
import type { TemplateCategoryUI } from 'src/types'

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
  isValidForSave,
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

const banners = computed(() => {
  const bannersList = []

  if (!isEditMode.value) {
    bannersList.push({
      type: 'readonly',
      class: 'bg-orange-1 text-orange-8',
      icon: 'eva-eye-outline',
      message: `Read-only access. Contact the owner to edit.`,
    })
  }

  return bannersList
})

const { openDialog, closeDialog, getDialogState } = useEditablePage()

const {
  lastAddedCategoryId,
  setCategoryRef,
  focusLastItemInCategory,
  scrollToFirstInvalidField,
  resetLastAddedCategory,
} = useCategoryRefs(templateItems)
const allCategoriesExpanded = ref(false)
const showDeleteDialog = ref(false)
const formRef = ref<QForm>()
const form = ref({
  name: '',
  duration: 'monthly' as string,
})

const nameError = ref(false)
const nameErrorMessage = ref('')

const formattedTotalAmount = computed(() =>
  formatCurrency(totalAmount.value, templateCurrency.value),
)

const enrichedCategories = computed(() => {
  return categoryGroups.value.reduce((acc, group) => {
    const category = categoriesStore.getCategoryById(group.categoryId)
    if (category) {
      acc.push({
        ...group,
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon,
      })
    }
    return acc
  }, [] as TemplateCategoryUI[])
})

// Dialog states
const showCategoryDialog = computed({
  get: () => getDialogState('category'),
  set: (value: boolean) => (value ? openDialog('category') : closeDialog('category')),
})

const isShareDialogOpen = computed({
  get: () => getDialogState('share'),
  set: (value: boolean) => (value ? openDialog('share') : closeDialog('share')),
})

// Action Bar Actions
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

// Component methods

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

  let hasFormErrors = false
  let hasItemErrors = false

  if (!form.value.name || form.value.name.trim().length === 0) {
    nameError.value = true
    nameErrorMessage.value = 'Template name is required'
    hasFormErrors = true
  }

  if (formRef.value?.validate) {
    const isFormValid = await formRef.value.validate()
    if (!isFormValid) {
      hasFormErrors = true
    }
  }

  if (!isValidForSave.value) {
    hasItemErrors = true

    if (!hasValidItems.value) {
      await scrollToFirstInvalidField()
    } else if (hasDuplicateItems.value) {
      notificationsStore.showError(
        'You have duplicate item names within the same category. Please use unique names.',
      )

      allCategoriesExpanded.value = true
      await nextTick()
    }
  }

  if (hasFormErrors) {
    notificationsStore.showError('Please fix the form errors before saving')
  }

  if (hasFormErrors || hasItemErrors) return

  const templateItems = getTemplateItemsForSave()

  let result
  if (isNewTemplate.value) {
    result = await createNewTemplateWithItems(
      form.value.name.trim(),
      form.value.duration,
      totalAmount.value,
      templateItems,
    )
  } else {
    result = await updateExistingTemplateWithItems(
      form.value.name.trim(),
      form.value.duration,
      totalAmount.value,
      templateItems,
    )
  }

  if (result.success) {
    notificationsStore.showSuccess(
      isNewTemplate.value ? 'Template created successfully' : 'Template updated successfully',
    )
    goBack()
  }
  // Error notification already shown by store
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
