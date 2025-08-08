<template>
  <DetailPageLayout
    :page-title="pageTitle"
    :page-icon="pageIcon"
    :breadcrumbs="breadcrumbs"
    :banners="banners"
    :is-loading="isTemplateLoading"
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
                v-if="expenseTemplateItems.length > 0"
                :label="expenseTemplateItems.length"
                color="primary"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              />
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                v-if="expenseTemplateItems.length > 1"
                flat
                :icon="allCategoriesExpanded ? 'eva-collapse-outline' : 'eva-expand-outline'"
                :label="allCategoriesExpanded ? 'Collapse All' : 'Expand All'"
                color="primary"
                @click="toggleAllCategories"
              />
              <q-btn
                icon="eva-plus-outline"
                label="Add Category"
                color="primary"
                @click="openDialog('category')"
              />
            </div>
          </div>

          <q-banner
            v-if="expenseTemplateItems.length > 0 && hasDuplicateItems"
            class="bg-orange-1 text-orange-8 q-mb-md"
            rounded
          >
            <template #avatar>
              <q-icon name="eva-alert-triangle-outline" />
            </template>
            You have duplicate item names within the same category. Please use unique names for each
            item.
          </q-banner>

          <div v-if="expenseTemplateItems.length > 0">
            <ExpenseTemplateCategory
              v-for="group in enrichedExpenseCategories"
              :key="group.categoryId"
              :ref="(el) => setCategoryRef(el, group.categoryId)"
              :category-id="group.categoryId"
              :category-name="group.categoryName"
              :category-color="group.categoryColor"
              :items="group.items"
              :subtotal="group.subtotal"
              :currency="templateCurrency"
              :readonly="false"
              :default-expanded="getCategoryExpanded(group.categoryId)"
              @update-item="updateExpenseTemplateItem"
              @remove-item="removeExpenseTemplateItem"
              @add-item="handleAddExpenseTemplateItem"
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
              Start building your template by adding named expense items with categories and amounts
            </div>
            <q-btn
              color="primary"
              icon="eva-plus-outline"
              label="Add Your First Expense Category"
              unelevated
              @click="openDialog('category')"
            />
          </div>
        </div>

        <div v-if="expenseTemplateItems.length > 0">
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
            <div class="text-h4 text-primary text-weight-bold">
              {{ formattedTotalAmount }}
            </div>
          </div>
          <div class="text-body2 text-grey-6">
            Total across {{ expenseTemplateItems.length }}
            {{ expenseTemplateItems.length === 1 ? 'category' : 'categories' }}
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
              v-if="expenseTemplateItems.length > 0"
              :label="expenseTemplateItems.length"
              color="primary"
              text-color="white"
              size="sm"
              class="q-ml-sm"
            />
          </div>
        </div>

        <div v-if="expenseTemplateItems.length > 0">
          <ExpenseTemplateCategory
            v-for="group in enrichedExpenseCategories"
            :key="group.categoryId"
            :category-id="group.categoryId"
            :category-name="group.categoryName"
            :category-color="group.categoryColor"
            :items="group.items"
            :subtotal="group.subtotal"
            :currency="templateCurrency"
            :readonly="true"
            @update-item="updateExpenseTemplateItem"
            @remove-item="removeExpenseTemplateItem"
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
            This template doesn't have any expense items yet
          </div>
        </div>
      </div>

      <div v-if="expenseTemplateItems.length > 0">
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
          <div class="text-h4 text-primary text-weight-bold">
            {{ formattedTotalAmount }}
          </div>
        </div>
        <div class="text-body2 text-grey-6">
          Total across {{ expenseTemplateItems.length }}
          {{ expenseTemplateItems.length === 1 ? 'category' : 'categories' }}
        </div>
      </div>
    </q-card>

    <!-- Dialogs Slot -->
    <template #dialogs>
      <ExpenseCategorySelectionDialog
        v-model="showCategoryDialog"
        :used-category-ids="getUsedCategoryIds()"
        :categories="categoriesStore.categories"
        @category-selected="onCategorySelected"
      />

      <ShareExpenseTemplateDialog
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

    <!-- FAB Slot -->
    <template #fab>
      <ActionsFab
        v-if="isEditMode"
        v-model="fabOpen"
        :actions="fabActions"
        :visible="true"
      />
    </template>
  </DetailPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { QForm } from 'quasar'

import DetailPageLayout from 'src/layouts/DetailPageLayout.vue'
import ActionsFab from 'src/components/shared/ActionsFab.vue'
import ExpenseTemplateCategory from 'src/components/expense-templates/ExpenseTemplateCategory.vue'
import ExpenseCategorySelectionDialog from 'src/components/expense-categories/ExpenseCategorySelectionDialog.vue'
import ShareExpenseTemplateDialog from 'src/components/expense-templates/ShareExpenseTemplateDialog.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useExpenseTemplateItems } from 'src/composables/useExpenseTemplateItems'
import { useError } from 'src/composables/useError'
import { formatCurrency } from 'src/utils/currency'
import { useExpenseTemplate } from 'src/composables/useExpenseTemplate'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import type { ExpenseCategory } from 'src/api'
import type { ExpenseTemplateCategoryUI } from 'src/types'

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
} = useExpenseTemplate()

const {
  expenseTemplateItems,
  totalAmount,
  hasValidItems,
  hasDuplicateItems,
  isValidForSave,
  expenseCategoryGroups,
  addExpenseTemplateItem,
  updateExpenseTemplateItem,
  removeExpenseTemplateItem,
  loadExpenseTemplateItems,
  getExpenseTemplateItemsForSave,
  getUsedCategoryIds,
} = useExpenseTemplateItems()

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
  isEditMode.value,
)

// Custom breadcrumbs with reactive template name
const breadcrumbs = computed(() => [
  {
    label: pageConfig.entityNamePlural,
    icon: pageConfig.listIcon,
    to: pageConfig.listRoute,
  },
  {
    label: isNewTemplate.value
      ? `New ${pageConfig.entityName}`
      : form.value.name || pageConfig.entityName,
    icon: isNewTemplate.value ? 'eva-plus-outline' : pageConfig.listIcon,
  },
])

const { fabOpen, openDialog, closeDialog, getDialogState, createFabAction, initializeFab } =
  useEditablePage()

// Local state
const categoryRefs = ref<Map<string, InstanceType<typeof ExpenseTemplateCategory>>>(new Map())
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

const enrichedExpenseCategories = computed(() => {
  return expenseCategoryGroups.value.reduce((acc, group) => {
    const category = categoriesStore.getCategoryById(group.categoryId)
    if (category) {
      acc.push({
        ...group,
        categoryName: category.name,
        categoryColor: category.color || '#1976d2',
      })
    }
    return acc
  }, [] as ExpenseTemplateCategoryUI[])
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

// FAB Actions
const fabActions = computed(() => [
  {
    key: 'add-category',
    icon: 'eva-plus-outline',
    label: 'Add Category',
    color: 'primary',
    handler: createFabAction(() => openDialog('category')),
  },
  {
    key: 'save',
    icon: 'eva-save-outline',
    label: 'Save Template',
    color: 'positive',
    loading: templatesStore.isLoading,
    handler: createFabAction(saveTemplate),
  },
  {
    key: 'share',
    icon: 'eva-share-outline',
    label: 'Share',
    color: 'info',
    visible: !isNewTemplate.value && isOwner.value,
    handler: createFabAction(() => openDialog('share')),
  },
  {
    key: 'delete',
    icon: 'eva-trash-2-outline',
    label: 'Delete Template',
    color: 'negative',
    visible: !isNewTemplate.value && isOwner.value,
    handler: createFabAction(() => {
      showDeleteDialog.value = true
    }),
  },
])

// Component methods
function setCategoryRef(el: unknown, categoryId: string): void {
  if (el && typeof el === 'object' && 'focusLastItem' in el) {
    const component = el as InstanceType<typeof ExpenseTemplateCategory>
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

async function handleAddExpenseTemplateItem(
  categoryId: string,
  categoryColor: string,
): Promise<void> {
  addExpenseTemplateItem(categoryId, categoryColor)

  await nextTick()
  focusLastItem(categoryId)
}

async function onCategorySelected(category: ExpenseCategory): Promise<void> {
  addExpenseTemplateItem(category.id, category.color || '#1976d2')
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
  const templateItems = getExpenseTemplateItemsForSave()

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

  loadExpenseTemplateItems(template)
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

  await initializeFab()
})
</script>
