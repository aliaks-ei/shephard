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
      <q-card
        flat
        bordered
        :class="$q.screen.lt.md ? 'q-pa-md q-mb-md' : 'q-px-md q-pt-md q-mb-lg'"
      >
        <div
          class="row"
          :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
        >
          <div class="col-12 col-sm-8">
            <div class="row items-center q-mb-md">
              <q-icon
                name="eva-info-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 q-my-none">Basic Information</h2>
            </div>
            <q-input
              v-model="form.name"
              label="Template Name"
              outlined
              no-error-icon
              :hide-bottom-space="$q.screen.lt.md"
              :rules="nameRules"
              :error="nameError"
              :error-message="nameErrorMessage"
              :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mb-md'"
              @update:model-value="clearNameError"
            />
          </div>
          <div class="col-12 col-sm">
            <div class="row items-center q-mb-md">
              <q-icon
                name="eva-calendar-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 q-my-none">Duration</h2>
            </div>
            <q-select
              v-model="form.duration"
              :options="durationSelectOptions"
              outlined
              emit-value
              map-options
              style="min-width: 120px"
            />
          </div>
        </div>
      </q-card>

      <!-- Categories Card -->
      <q-card
        flat
        bordered
        class="q-pa-md"
      >
        <div class="row items-center justify-between q-mb-md">
          <div class="row items-center">
            <q-icon
              name="eva-grid-outline"
              class="q-mr-sm"
              size="20px"
            />
            <h2 class="text-h6 q-my-none">Categories</h2>
            <q-chip
              v-if="templateItems.length > 0"
              :label="templateItems.length"
              color="primary"
              text-color="white"
              size="sm"
              class="q-ml-sm"
            />
          </div>

          <div class="row q-gutter-sm">
            <q-btn
              v-if="templateItems.length > 0"
              flat
              :icon="allCategoriesExpanded ? 'eva-collapse-outline' : 'eva-expand-outline'"
              :label="$q.screen.lt.md ? '' : allCategoriesExpanded ? 'Collapse All' : 'Expand All'"
              color="primary"
              no-caps
              @click="toggleAllCategories"
            />
            <q-btn
              v-if="!$q.screen.lt.md"
              icon="eva-plus-outline"
              label="Add category"
              color="primary"
              no-caps
              @click="openDialog('category')"
            />
          </div>
        </div>

        <q-banner
          v-if="templateItems.length > 0 && hasDuplicateItems"
          :class="$q.dark.isActive ? 'bg-orange-9 text-orange-3' : 'bg-orange-1 text-orange-8'"
          class="q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="eva-alert-triangle-outline" />
          </template>
          You have duplicate item names within the same category. Please use unique names for each
          item.
        </q-banner>

        <div v-if="templateItems.length > 0">
          <TemplateCategory
            v-for="group in enrichedCategories"
            :key="`${group.categoryId}-${allCategoriesExpanded}`"
            :ref="(el) => setCategoryRef(el, group.categoryId)"
            :category-id="group.categoryId"
            :category-name="group.categoryName"
            :category-color="group.categoryColor"
            :category-icon="group.categoryIcon"
            :items="group.items"
            :subtotal="group.subtotal"
            :currency="templateCurrency"
            :readonly="false"
            :default-expanded="allCategoriesExpanded || group.categoryId === lastAddedCategoryId"
            @update-item="updateTemplateItem"
            @remove-item="removeTemplateItem"
            @add-item="handleAddTemplateItem"
          />
        </div>

        <div
          v-else
          class="text-center q-py-xl"
        >
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

        <div v-if="templateItems.length > 0">
          <q-separator :class="$q.screen.lt.md ? 'q-my-md' : 'q-my-lg'" />
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-icon
                name="eva-credit-card-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 q-my-none">Total Amount</h2>
            </div>
            <div
              :class="['text-primary text-weight-bold', $q.screen.lt.md ? 'text-h6' : 'text-h5']"
            >
              {{ formattedTotalAmount }}
            </div>
          </div>
          <div class="text-caption text-grey-6">
            Total across {{ templateItems.length }}
            {{ templateItems.length === 1 ? 'category' : 'categories' }}
          </div>
        </div>
      </q-card>
    </q-form>

    <!-- Read-only view -->
    <div v-else>
      <!-- Basic Information Card -->
      <q-card
        flat
        bordered
        :class="$q.screen.lt.md ? 'q-pa-md q-mb-md' : 'q-px-md q-pt-md q-mb-lg'"
      >
        <div
          class="row"
          :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
        >
          <div class="col-12 col-sm-8">
            <div class="row items-center q-mb-md">
              <q-icon
                name="eva-info-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 q-my-none">Basic Information</h2>
            </div>
            <q-input
              v-model="form.name"
              label="Template Name"
              outlined
              readonly
              no-error-icon
              :hide-bottom-space="$q.screen.lt.md"
              :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mb-md'"
            />
          </div>
          <div class="col-12 col-sm">
            <div class="row items-center q-mb-md">
              <q-icon
                name="eva-calendar-outline"
                class="q-mr-sm"
                size="24px"
              />
              <h2 class="text-h6 q-my-none">Duration</h2>
            </div>
            <q-chip
              :label="form.duration"
              color="primary"
              text-color="primary"
              class="text-capitalize"
              :ripple="false"
              outline
            />
          </div>
        </div>
      </q-card>

      <!-- Categories Card -->
      <q-card
        flat
        bordered
        class="q-pa-md"
      >
        <div class="q-mb-lg">
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center">
              <q-icon
                name="eva-grid-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 q-my-none">Categories</h2>
              <q-chip
                v-if="templateItems.length > 0"
                :label="templateItems.length"
                color="primary"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              />
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                v-if="templateItems.length > 0"
                flat
                :icon="allCategoriesExpanded ? 'eva-collapse-outline' : 'eva-expand-outline'"
                :label="
                  $q.screen.lt.md ? '' : allCategoriesExpanded ? 'Collapse All' : 'Expand All'
                "
                color="primary"
                no-caps
                @click="toggleAllCategories"
              />
            </div>
          </div>

          <div v-if="templateItems.length > 0">
            <TemplateCategory
              v-for="group in enrichedCategories"
              :key="`${group.categoryId}-${allCategoriesExpanded}`"
              :category-id="group.categoryId"
              :category-name="group.categoryName"
              :category-color="group.categoryColor"
              :category-icon="group.categoryIcon"
              :items="group.items"
              :subtotal="group.subtotal"
              :currency="templateCurrency"
              :readonly="true"
              :default-expanded="allCategoriesExpanded"
              @update-item="updateTemplateItem"
              @remove-item="removeTemplateItem"
            />
          </div>

          <div
            v-else
            class="text-center q-py-xl"
          >
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
        </div>

        <div v-if="templateItems.length > 0">
          <q-separator class="q-mb-lg" />
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-icon
                name="eva-credit-card-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 q-my-none">Total Amount</h2>
            </div>
            <div
              :class="['text-primary text-weight-bold', $q.screen.lt.md ? 'text-h5' : 'text-h4']"
            >
              {{ formattedTotalAmount }}
            </div>
          </div>
          <div class="text-body2 text-grey-6">
            Total across {{ templateItems.length }}
            {{ templateItems.length === 1 ? 'category' : 'categories' }}
          </div>
        </div>
      </q-card>
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
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { useTemplateItems } from 'src/composables/useTemplateItems'
import { formatCurrency } from 'src/utils/currency'
import { useTemplate } from 'src/composables/useTemplate'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import type { Category } from 'src/api'
import type { TemplateCategoryUI, TemplateItemUI } from 'src/types'

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

const categoryRefs = ref<Map<string, InstanceType<typeof TemplateCategory>>>(new Map())
const lastAddedCategoryId = ref<string | null>(null)
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

const nameRules = computed(() => [
  (val: string) => {
    if (!val || val.trim().length === 0) {
      return 'Template name is required'
    }
    if (val.length > 100) {
      return 'Template name must be 100 characters or less'
    }
    return true
  },
])

const durationSelectOptions = computed(() => [
  {
    label: 'Weekly',
    value: 'weekly',
  },
  {
    label: 'Monthly',
    value: 'monthly',
  },
  {
    label: 'Yearly',
    value: 'yearly',
  },
])

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
function setCategoryRef(el: unknown, categoryId: string): void {
  if (el && typeof el === 'object' && 'focusLastItem' in el) {
    const component = el as InstanceType<typeof TemplateCategory>
    if (typeof component.focusLastItem === 'function') {
      categoryRefs.value.set(categoryId, component)
    }
  } else {
    categoryRefs.value.delete(categoryId)
  }
}

function focusLastItem(categoryId: string): void {
  const categoryRef = categoryRefs.value.get(categoryId)

  if (categoryRef) {
    categoryRef.focusLastItem()
  }
}

async function handleAddTemplateItem(categoryId: string, categoryColor: string): Promise<void> {
  addTemplateItem(categoryId, categoryColor)

  await nextTick()
  focusLastItem(categoryId)
}

async function onCategorySelected(category: Category): Promise<void> {
  addTemplateItem(category.id, category.color || '#1976d2')
  lastAddedCategoryId.value = category.id
  closeDialog('category')

  await nextTick()
  focusLastItem(category.id)
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

function getFirstInvalidItem(): { categoryId: string; item: TemplateItemUI } | null {
  for (const item of templateItems.value) {
    if (!item.name.trim() || item.amount <= 0) {
      return { categoryId: item.categoryId, item }
    }
  }
  return null
}

async function scrollToFirstInvalidField(): Promise<void> {
  const firstInvalidItem = getFirstInvalidItem()
  if (!firstInvalidItem) return

  const categoryRef = categoryRefs.value.get(firstInvalidItem.categoryId)
  if (!categoryRef) return

  const categoryElement = categoryRef.$el
  if (!categoryElement) return

  categoryElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })

  await nextTick()
  lastAddedCategoryId.value = firstInvalidItem.categoryId
  categoryRef.focusFirstInvalidItem()
}

async function saveTemplate(): Promise<void> {
  lastAddedCategoryId.value = null
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

  let success = false
  const templateItems = getTemplateItemsForSave()

  if (isNewTemplate.value) {
    success = await createNewTemplateWithItems(
      form.value.name.trim(),
      form.value.duration,
      totalAmount.value,
      templateItems,
    )
  } else {
    success = await updateExistingTemplateWithItems(
      form.value.name.trim(),
      form.value.duration,
      totalAmount.value,
      templateItems,
    )
  }

  if (success) {
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

  await templatesStore.removeTemplate(routeTemplateId.value)
  showDeleteDialog.value = false
  goBack()
}

function onTemplateShared(): void {
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
