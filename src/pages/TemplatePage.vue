<template>
  <DetailPageLayout
    :page-title="pageTitle"
    :page-icon="pageIcon"
    :banners="banners"
    :is-loading="isTemplateLoading"
    :actions="actionBarActions"
    :actions-visible="isEditMode"
    @back="goBack"
  >
    <!-- Main Content -->
    <q-form
      v-if="isEditMode"
      ref="formRef"
      @submit="saveTemplate"
    >
      <q-card
        flat
        bordered
        class="q-pa-lg"
      >
        <div class="q-mb-md">
          <div class="row q-gutter-md">
            <div class="col-12 col-sm-8">
              <div class="text-h6 q-mb-md">
                <q-icon
                  name="eva-info-outline"
                  class="q-mr-sm"
                />
                Basic Information
              </div>
              <q-input
                v-model="form.name"
                label="Template Name"
                outlined
                :rules="nameRules"
                :error="nameError"
                :error-message="nameErrorMessage"
                @update:model-value="clearNameError"
              />
            </div>
            <div class="col-12 col-sm">
              <div class="text-h6 q-mb-md">
                <q-icon
                  name="eva-calendar-outline"
                  class="q-mr-sm"
                />
                Duration
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
        </div>

        <q-separator class="q-mb-lg" />

        <div class="q-mb-lg">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">
              <q-icon
                name="eva-grid-outline"
                class="q-mr-sm"
              />
              Categories
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
                flat
                :icon="allCategoriesExpanded ? 'eva-collapse-outline' : 'eva-expand-outline'"
                :label="allCategoriesExpanded ? 'Collapse All' : 'Expand All'"
                color="primary"
                @click="toggleAllCategories"
              />
              <q-btn
                icon="eva-plus-outline"
                label="Add"
                color="primary"
                @click="openDialog('category')"
              />
            </div>
          </div>

          <q-banner
            v-if="templateItems.length > 0 && hasDuplicateItems"
            class="bg-orange-1 text-orange-8 q-mb-md"
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
              :key="group.categoryId"
              :ref="(el: unknown) => setCategoryRef(el, group.categoryId)"
              :category-id="group.categoryId"
              :category-name="group.categoryName"
              :category-color="group.categoryColor"
              :category-icon="group.categoryIcon"
              :items="group.items"
              :subtotal="group.subtotal"
              :currency="templateCurrency"
              :readonly="false"
              :default-expanded="getCategoryExpanded(group.categoryId)"
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
              @click="openDialog('category')"
            />
          </div>
        </div>

        <div v-if="templateItems.length > 0">
          <q-separator class="q-mb-lg" />
          <div class="row items-center justify-between">
            <div
              class="text-h6"
              style="display: flex; align-items: center"
            >
              <q-icon
                name="eva-credit-card-outline"
                class="q-mr-sm"
              />
              Total Amount
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
    </q-form>

    <!-- Read-only view -->
    <q-card
      v-else
      flat
      bordered
      class="q-pa-lg"
    >
      <div class="q-mb-lg">
        <div class="text-h6 q-mb-md">
          <q-icon
            name="eva-info-outline"
            class="q-mr-sm"
          />
          Basic Information
        </div>

        <q-input
          v-model="form.name"
          label="Template Name"
          outlined
          readonly
          class="q-mb-md"
        />
      </div>

      <q-separator class="q-mb-lg" />

      <div class="q-mb-lg">
        <div class="text-h6 q-mb-md">
          <q-icon
            name="eva-calendar-outline"
            class="q-mr-sm"
          />
          Duration
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

      <q-separator class="q-mb-lg" />

      <div class="q-mb-lg">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">
            <q-icon
              name="eva-grid-outline"
              class="q-mr-sm"
            />
            Categories
            <q-chip
              v-if="templateItems.length > 0"
              :label="templateItems.length"
              color="primary"
              text-color="white"
              size="sm"
              class="q-ml-sm"
            />
          </div>
        </div>

        <div v-if="templateItems.length > 0">
          <TemplateCategory
            v-for="group in enrichedCategories"
            :key="group.categoryId"
            :category-id="group.categoryId"
            :category-name="group.categoryName"
            :category-color="group.categoryColor"
            :category-icon="group.categoryIcon"
            :items="group.items"
            :subtotal="group.subtotal"
            :currency="templateCurrency"
            :readonly="true"
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
          <div class="text-body2 text-grey-5 q-mb-lg">This template doesn't have any items yet</div>
        </div>
      </div>

      <div v-if="templateItems.length > 0">
        <q-separator class="q-mb-lg" />
        <div class="row items-center justify-between">
          <div
            class="text-h6"
            style="display: flex; align-items: center"
          >
            <q-icon
              name="eva-credit-card-outline"
              class="q-mr-sm"
            />
            Total Amount
          </div>
          <div :class="['text-primary text-weight-bold', $q.screen.lt.md ? 'text-h5' : 'text-h4']">
            {{ formattedTotalAmount }}
          </div>
        </div>
        <div class="text-body2 text-grey-6">
          Total across {{ templateItems.length }}
          {{ templateItems.length === 1 ? 'category' : 'categories' }}
        </div>
      </div>
    </q-card>

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
import { useTemplateItems } from 'src/composables/useTemplateItems'
import { useError } from 'src/composables/useError'
import { formatCurrency } from 'src/utils/currency'
import { useTemplate } from 'src/composables/useTemplate'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import type { Category } from 'src/api'
import type { TemplateCategoryUI } from 'src/types'

const router = useRouter()
const templatesStore = useTemplatesStore()
const categoriesStore = useCategoriesStore()
const { handleError } = useError()

const {
  isTemplateLoading,
  isNewTemplate,
  routeTemplateId,
  isOwner,
  isReadOnlyMode,
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

// Page state configuration
const pageConfig = {
  entityName: 'Template',
  entityNamePlural: 'Templates',
  listRoute: '/templates',
  listIcon: 'eva-grid-outline',
  createIcon: 'eva-plus-circle-outline',
  editIcon: 'eva-edit-outline',
  viewIcon: 'eva-eye-outline',
}

const { pageTitle, pageIcon, banners } = useDetailPageState(
  pageConfig,
  isNewTemplate.value,
  isReadOnlyMode.value,
)

const { openDialog, closeDialog, getDialogState } = useEditablePage()

// Local state
const categoryRefs = ref<Map<string, InstanceType<typeof TemplateCategory>>>(new Map())
const lastAddedCategoryId = ref<string | null>(null)
const allCategoriesExpanded = ref(false)
const showDeleteDialog = ref(false)
const formRef = ref<QForm>()
const form = ref({
  name: '',
  duration: 'monthly' as string,
})

// Error states for validation
const nameError = ref(false)
const nameErrorMessage = ref('')

// Computed properties
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
    key: 'save',
    icon: 'eva-save-outline',
    label: 'Save',
    color: 'positive',
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

function getCategoryExpanded(categoryId: string): boolean {
  return allCategoriesExpanded.value || categoryId === lastAddedCategoryId.value
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
  // Clear previous errors
  clearNameError()

  if (!form.value.name || form.value.name.trim().length === 0) {
    nameError.value = true
    nameErrorMessage.value = 'Template name is required'
    handleError('TEMPLATES.NAME_VALIDATION_FAILED', new Error('Template name is required'))
    return
  }

  if (formRef.value?.validate) {
    const isFormValid = await formRef.value.validate()
    if (!isFormValid) return
  }

  if (!isValidForSave.value) {
    if (!hasValidItems.value) {
      handleError('TEMPLATE_ITEMS.VALIDATION_FAILED', new Error('No valid items'))
    } else if (hasDuplicateItems.value) {
      handleError(
        'TEMPLATE_ITEMS.DUPLICATE_NAME_CATEGORY',
        new Error('Duplicate name and category combination'),
      )
    }
    return
  }

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
