<template>
  <div class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <q-toolbar class="q-mb-lg q-px-none">
          <q-btn
            flat
            round
            icon="eva-arrow-back-outline"
            @click="goBack"
          />

          <q-toolbar-title>
            <div class="row items-center">
              <q-icon
                :name="pageIcon"
                size="sm"
                class="q-mr-sm"
              />
              {{ pageTitle }}
            </div>
          </q-toolbar-title>
        </q-toolbar>

        <q-breadcrumbs
          class="q-mb-lg text-grey-6"
          active-color="primary"
        >
          <q-breadcrumbs-el
            label="Templates"
            icon="eva-grid-outline"
            to="/templates"
          />
          <q-breadcrumbs-el
            :label="breadcrumbLabel"
            :icon="breadcrumbIcon"
          />
        </q-breadcrumbs>

        <q-banner
          v-if="isReadOnlyMode"
          class="bg-orange-1 text-orange-8 q-mb-lg"
          rounded
        >
          <template #avatar>
            <q-icon name="eva-eye-outline" />
          </template>
          You're viewing this template in read-only mode. Contact the owner for edit access.
        </q-banner>

        <div v-if="isTemplateLoading">
          <div class="q-pa-lg">
            <q-skeleton
              type="text"
              width="40%"
              class="q-mb-md"
            />
            <q-skeleton
              type="QInput"
              class="q-mb-lg"
            />
            <q-skeleton
              type="text"
              width="30%"
              class="q-mb-md"
            />
            <q-skeleton
              type="rect"
              height="50px"
              class="q-mb-lg"
            />
            <q-skeleton
              type="text"
              width="35%"
              class="q-mb-md"
            />
            <q-skeleton
              type="rect"
              height="200px"
            />
          </div>
        </div>

        <div v-else>
          <q-form
            v-if="isEditMode"
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
                      :rules="[(val) => !!val || 'Template name is required']"
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
                      @click="showCategoryDialog = true"
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
                  You have duplicate item names within the same category. Please use unique names
                  for each item.
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
                    Start building your template by adding named expense items with categories and
                    amounts
                  </div>
                  <q-btn
                    color="primary"
                    icon="eva-plus-outline"
                    label="Add Your First Expense Category"
                    unelevated
                    @click="showCategoryDialog = true"
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
        </div>
      </div>
    </div>

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

    <!-- Floating Action Button -->
    <q-page-sticky
      position="bottom-right"
      :offset="[16, 16]"
    >
      <q-fab
        v-if="isEditMode"
        v-model="fabOpen"
        icon="eva-arrow-ios-upward-outline"
        active-icon="eva-close-outline"
        direction="up"
        color="primary"
        class="fixed-bottom-right"
        label="Actions"
        label-position="left"
        vertical-actions-align="right"
      >
        <q-fab-action
          icon="eva-plus-outline"
          external-label
          label="Add Category"
          label-position="left"
          label-class="text-weight-medium"
          color="primary"
          @click="handleAddCategoryClick"
        />

        <q-fab-action
          icon="eva-save-outline"
          external-label
          label="Save Template"
          label-position="left"
          label-class="text-weight-medium"
          color="positive"
          :loading="templatesStore.isLoading"
          @click="handleSaveClick"
        />

        <q-fab-action
          v-if="!isNewTemplate && isOwner"
          icon="eva-share-outline"
          external-label
          label="Share"
          label-position="left"
          label-class="text-weight-medium"
          color="info"
          @click="handleShareClick"
        />

        <q-fab-action
          icon="eva-trash-2-outline"
          external-label
          label="Discard"
          label-position="left"
          label-class="text-weight-medium"
          color="negative"
          @click="handleDiscardClick"
        />
      </q-fab>
    </q-page-sticky>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { QForm } from 'quasar'

import ExpenseTemplateCategory from 'src/components/expense-templates/ExpenseTemplateCategory.vue'
import ExpenseCategorySelectionDialog from 'src/components/expense-categories/ExpenseCategorySelectionDialog.vue'
import ShareExpenseTemplateDialog from 'src/components/expense-templates/ShareExpenseTemplateDialog.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useExpenseTemplateItems } from 'src/composables/useExpenseTemplateItems'
import { useError } from 'src/composables/useError'
import { formatCurrency } from 'src/utils/currency'
import { useExpenseTemplate } from 'src/composables/useExpenseTemplate'
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

const isShareDialogOpen = ref(false)
const showCategoryDialog = ref(false)
const categoryRefs = ref<Map<string, InstanceType<typeof ExpenseTemplateCategory>>>(new Map())
const lastAddedCategoryId = ref<string | null>(null)
const allCategoriesExpanded = ref(false)
const fabOpen = ref(false)
const form = ref({
  name: '',
  duration: 'monthly' as string,
})

const formattedTotalAmount = computed(() =>
  formatCurrency(totalAmount.value, templateCurrency.value),
)

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

const pageTitle = computed(() => {
  if (isNewTemplate.value) return 'Create Template'
  if (isReadOnlyMode.value) return 'View Template'
  return 'Edit Template'
})

const pageIcon = computed(() => {
  if (isNewTemplate.value) return 'eva-plus-circle-outline'
  if (isReadOnlyMode.value) return 'eva-eye-outline'
  return 'eva-edit-outline'
})

const breadcrumbLabel = computed(() => {
  if (isNewTemplate.value) return 'New Template'
  if (isReadOnlyMode.value) return 'View Template'
  return 'Edit Template'
})

const breadcrumbIcon = computed(() => {
  if (isNewTemplate.value) return 'eva-plus-outline'
  if (isReadOnlyMode.value) return 'eva-eye-outline'
  return 'eva-edit-outline'
})

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

  await nextTick()
  focusLastItem(category.id)
}

function getCategoryExpanded(categoryId: string): boolean {
  // If global expand/collapse is active, use that state
  // Otherwise, expand only if it's the last added category
  return allCategoriesExpanded.value || categoryId === lastAddedCategoryId.value
}

function toggleAllCategories(): void {
  allCategoriesExpanded.value = !allCategoriesExpanded.value
  // Clear lastAddedCategoryId so it doesn't interfere with the global state
  if (allCategoriesExpanded.value) {
    lastAddedCategoryId.value = null
  }
}

// FAB action handlers that close the FAB after action
function handleAddCategoryClick(): void {
  fabOpen.value = false
  showCategoryDialog.value = true
}

function handleSaveClick(): void {
  fabOpen.value = false
  saveTemplate()
}

function handleShareClick(): void {
  fabOpen.value = false
  openShareDialog()
}

function handleDiscardClick(): void {
  fabOpen.value = false
  goBack()
}

function goBack(): void {
  router.push({ name: 'templates' })
}

async function saveTemplate(): Promise<void> {
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
      form.value.name,
      form.value.duration,
      totalAmount.value,
      templateItems,
    )
  } else {
    success = await updateExistingTemplateWithItems(
      form.value.name,
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

function openShareDialog(): void {
  isShareDialogOpen.value = true
}

function onTemplateShared(): void {
  templatesStore.loadTemplates()
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
