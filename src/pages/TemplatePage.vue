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

        <!-- Breadcrumb Navigation -->
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

        <!-- Read-Only Mode Banner -->
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

        <!-- Loading State -->
        <div v-if="isLoading">
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

        <!-- Enhanced Template Form -->
        <div v-else>
          <q-form
            v-if="canEdit"
            ref="templateForm"
            @submit="saveTemplate"
          >
            <!-- Single Unified Card -->
            <q-card
              flat
              bordered
              class="q-pa-lg"
            >
              <!-- Basic Information Section -->
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
                  :rules="[(val) => !!val || 'Template name is required']"
                  class="q-mb-md"
                />
              </div>

              <q-separator class="q-mb-lg" />

              <!-- Duration Section -->
              <div class="q-mb-lg">
                <div class="text-h6 q-mb-md">
                  <q-icon
                    name="eva-calendar-outline"
                    class="q-mr-sm"
                  />
                  Duration
                </div>

                <q-btn-toggle
                  v-model="form.duration"
                  :options="durationToggleOptions"
                  class="duration-toggle"
                  no-caps
                  unelevated
                  spread
                  toggle-color="primary"
                  text-color="primary"
                />
              </div>

              <q-separator class="q-mb-lg" />

              <!-- Categories Section -->
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
                  <q-btn
                    color="primary"
                    icon="eva-plus-outline"
                    label="Add Expense Category"
                    unelevated
                    @click="showCategoryDialog = true"
                  />
                </div>

                <!-- Duplicate Items Warning -->
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

                <!-- Categories List - Grouped Display Only -->
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
                    :readonly="false"
                    @update-item="updateExpenseTemplateItem"
                    @remove-item="removeExpenseTemplateItem"
                    @add-item="addExpenseTemplateItem"
                  />
                </div>

                <!-- Enhanced Empty State -->
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

              <!-- Total Amount Section -->
              <div
                v-if="expenseTemplateItems.length > 0"
                class="q-mb-lg"
              >
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

              <!-- Action Buttons -->
              <div class="row q-gutter-md justify-end">
                <q-btn
                  flat
                  label="Discard"
                  color="grey-8"
                  @click="goBack"
                />
                <q-btn
                  v-if="!isNewTemplate && isOwner"
                  flat
                  label="Share"
                  color="primary"
                  icon="eva-share-outline"
                  @click="openShareDialog"
                />
                <q-btn
                  color="primary"
                  label="Save Template"
                  type="submit"
                  unelevated
                  :loading="templatesStore.isLoading"
                >
                  <template #loading>
                    <q-spinner-hourglass />
                  </template>
                </q-btn>
              </div>
            </q-card>
          </q-form>

          <!-- Read-Only View -->
          <q-card
            v-else
            flat
            bordered
            class="q-pa-lg"
          >
            <!-- Basic Information Section -->
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

            <!-- Duration Section -->
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

            <!-- Categories Section -->
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

              <!-- Categories List - Read-only Grouped Display -->
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

              <!-- Enhanced Empty State -->
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

            <!-- Total Amount Section -->
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

    <!-- Category Selection Dialog -->
    <ExpenseCategorySelectionDialog
      v-model="showCategoryDialog"
      :used-category-ids="getUsedCategoryIds()"
      :categories="categoriesStore.categories"
      @category-selected="onCategorySelected"
    />

    <!-- Share Template Dialog -->
    <ShareExpenseTemplateDialog
      v-if="routeTemplateId"
      v-model="isShareDialogOpen"
      :template-id="routeTemplateId"
      @shared="onTemplateShared"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { QForm } from 'quasar'

import ExpenseTemplateCategory from 'src/components/expense-templates/ExpenseTemplateCategory.vue'
import ExpenseCategorySelectionDialog from 'src/components/expense-categories/ExpenseCategorySelectionDialog.vue'
import ShareExpenseTemplateDialog from 'src/components/expense-templates/ShareExpenseTemplateDialog.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useUserStore } from 'src/stores/user'
import { useExpenseTemplateItems } from 'src/composables/useExpenseTemplateItems'
import { useError } from 'src/composables/useError'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type {
  ExpenseTemplateWithItems,
  ExpenseTemplateItemUI,
  ExpenseCategory,
  ExpenseTemplateCategoryUI,
} from 'src/api'

const route = useRoute()
const router = useRouter()
const templatesStore = useTemplatesStore()
const categoriesStore = useCategoriesStore()
const userStore = useUserStore()
const { handleError } = useError()
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

const templateForm = ref<QForm | null>(null)
const isLoading = ref(false)
const currentTemplate = ref<(ExpenseTemplateWithItems & { permission_level?: string }) | null>(null)
const isShareDialogOpen = ref(false)
const showCategoryDialog = ref(false)
const form = ref({
  name: '',
  duration: 'monthly' as string,
})

const isNewTemplate = computed(() => route.name === 'new-template')
const routeTemplateId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id : null,
)
const isOwner = computed(() => {
  if (!currentTemplate.value || !userStore.userProfile) return false
  return currentTemplate.value.owner_id === userStore.userProfile.id
})

const isReadOnlyMode = computed(() => {
  if (isNewTemplate.value) return false
  if (isOwner.value) return false
  return currentTemplate.value?.permission_level === 'view'
})

const canEdit = computed(() => {
  if (isNewTemplate.value) return true
  if (isOwner.value) return true
  return currentTemplate.value?.permission_level === 'edit'
})

// Get currency for the template - user preference for new, stored value for existing
const templateCurrency = computed((): CurrencyCode => {
  if (isNewTemplate.value) {
    return userStore.preferences.currency as CurrencyCode
  }

  return currentTemplate.value?.currency as CurrencyCode
})

const formattedTotalAmount = computed(() =>
  formatCurrency(totalAmount.value, templateCurrency.value),
)

const durationToggleOptions = [
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
]

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

// Enrich expense categories with category names from the store
const enrichedExpenseCategories = computed(() => {
  return expenseCategoryGroups.value.reduce((acc, group) => {
    const category = categoriesStore.getCategoryById(group.categoryId)
    if (category) {
      acc.push({
        ...group,
        categoryName: category.name,
        categoryColor: category.color,
      })
    }
    return acc
  }, [] as ExpenseTemplateCategoryUI[])
})

// Category selection and management
function onCategorySelected(category: ExpenseCategory): void {
  addExpenseTemplateItem(category.id, category.color)
}

function goBack(): void {
  router.push({ name: 'templates' })
}

async function createNewTemplateWithItems(): Promise<boolean> {
  const template = await templatesStore.addTemplate({
    name: form.value.name,
    duration: form.value.duration,
    total: totalAmount.value,
  })

  if (!template) return false

  const items = getExpenseTemplateItemsForSave().map((item) => ({
    ...item,
    template_id: template.id,
  }))

  await templatesStore.addItemsToTemplate(items)
  return true
}

async function updateExistingTemplateWithItems(): Promise<boolean> {
  if (!routeTemplateId.value || !currentTemplate.value) return false

  const template = await templatesStore.editTemplate(routeTemplateId.value, {
    name: form.value.name,
    duration: form.value.duration,
    total: totalAmount.value,
  })

  if (!template) return false

  const existingItemIds = currentTemplate.value.expense_template_items.map((item) => item.id)
  await templatesStore.removeItemsFromTemplate(existingItemIds)

  const items = getExpenseTemplateItemsForSave().map((item) => ({
    ...item,
    template_id: template.id,
  }))

  if (items.length > 0) {
    await templatesStore.addItemsToTemplate(items)
  }

  return true
}

async function saveTemplate(): Promise<void> {
  const isValid = await templateForm.value?.validate()

  if (!isValid) return
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

  if (isNewTemplate.value) {
    success = await createNewTemplateWithItems()
  } else {
    success = await updateExistingTemplateWithItems()
  }

  // Only redirect if the save was successful
  if (success) {
    goBack()
  }
}

async function loadTemplate(): Promise<void> {
  if (isNewTemplate.value || !routeTemplateId.value) return

  currentTemplate.value = await templatesStore.loadTemplateWithItems(routeTemplateId.value)

  if (!currentTemplate.value) return

  form.value.name = currentTemplate.value.name
  form.value.duration = currentTemplate.value.duration

  const items = currentTemplate.value.expense_template_items.reduce((acc, item) => {
    const category = categoriesStore.getCategoryById(item.category_id)

    if (category) {
      acc.push({
        id: item.id,
        name: item.name || '',
        categoryId: item.category_id,
        amount: item.amount,
        color: category.color,
      })
    }

    return acc
  }, [] as ExpenseTemplateItemUI[])

  loadExpenseTemplateItems(items)
}

function openShareDialog(): void {
  isShareDialogOpen.value = true
}

function onTemplateShared(): void {
  templatesStore.loadTemplates()
}

onMounted(async () => {
  isLoading.value = true

  try {
    await categoriesStore.loadCategories()
    await loadTemplate()
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.duration-toggle {
  border: 1px solid $primary;
}
</style>
