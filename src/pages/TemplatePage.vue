<template>
  <div class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <!-- Toolbar -->
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

          <q-skeleton
            v-if="isLoading"
            type="QBtn"
            width="260px"
          />

          <q-btn-toggle
            v-else-if="canEdit"
            v-model="form.duration"
            :options="durationToggleOptions"
            color="grey-4"
            text-color="grey-8"
            unelevated
          />

          <q-chip
            v-else
            :label="form.duration"
            color="grey-4"
            text-color="grey-8"
            class="text-capitalize"
            :ripple="false"
            square
          />
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
                      v-if="categoryItems.length > 0"
                      :label="categoryItems.length"
                      color="primary"
                      text-color="white"
                      size="sm"
                      class="q-ml-sm"
                    />
                  </div>
                  <q-btn
                    color="primary"
                    icon="eva-plus-outline"
                    label="Add Category"
                    unelevated
                    @click="addCategoryItem"
                  />
                </div>

                <!-- Categories List -->
                <div v-if="categoryItems.length > 0">
                  <q-list>
                    <TemplateCategory
                      v-for="item in categoryItems"
                      :key="item.id"
                      :model-value="item"
                      :category-options="getAvailableCategoriesForItem(item.id)"
                      :currency="templateCurrency"
                      @update:model-value="
                        (updatedItem) => updateCategoryItem(item.id, updatedItem)
                      "
                      @remove="removeCategoryItem(item.id)"
                    />
                  </q-list>
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
                    Start building your template by adding expense categories with amounts
                  </div>
                  <q-btn
                    color="primary"
                    icon="eva-plus-outline"
                    label="Add Your First Category"
                    unelevated
                    @click="addCategoryItem"
                  />
                </div>
              </div>

              <!-- Total Amount Section -->
              <div
                v-if="categoryItems.length > 0"
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
                  Total across {{ categoryItems.length }}
                  {{ categoryItems.length === 1 ? 'category' : 'categories' }}
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
                    v-if="categoryItems.length > 0"
                    :label="categoryItems.length"
                    color="primary"
                    text-color="white"
                    size="sm"
                    class="q-ml-sm"
                  />
                </div>
              </div>

              <!-- Categories List -->
              <div v-if="categoryItems.length > 0">
                <q-list>
                  <TemplateCategory
                    v-for="item in categoryItems"
                    :key="item.id"
                    :model-value="item"
                    :category-options="getAvailableCategoriesForItem(item.id)"
                    :currency="templateCurrency"
                    :readonly="true"
                    @update:model-value="(updatedItem) => updateCategoryItem(item.id, updatedItem)"
                    @remove="removeCategoryItem(item.id)"
                  />
                </q-list>
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
                  This template doesn't have any expense categories yet
                </div>
              </div>
            </div>

            <!-- Total Amount Section -->
            <div v-if="categoryItems.length > 0">
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
                Total across {{ categoryItems.length }}
                {{ categoryItems.length === 1 ? 'category' : 'categories' }}
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Share Template Dialog -->
    <ShareTemplateDialog
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

import TemplateCategory from 'src/components/TemplateCategory.vue'
import ShareTemplateDialog from 'src/components/ShareTemplateDialog.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useUserStore } from 'src/stores/user'
import { useTemplateCategoryItems } from 'src/composables/useTemplateCategoryItems'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { TemplateWithCategories, TemplateCategoryItem } from 'src/api'

const route = useRoute()
const router = useRouter()
const templatesStore = useTemplatesStore()
const categoriesStore = useCategoriesStore()
const userStore = useUserStore()
const {
  categoryItems,
  totalAmount,
  addCategoryItem,
  updateCategoryItem,
  removeCategoryItem,
  getAvailableCategoriesForItem,
  validateCategoryItems,
  loadCategoryItems,
  getCategoryItemsForSave,
} = useTemplateCategoryItems()

const templateForm = ref<QForm | null>(null)
const isLoading = ref(false)
const currentTemplate = ref<(TemplateWithCategories & { permission_level?: string }) | null>(null)
const isShareDialogOpen = ref(false)
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

function goBack(): void {
  router.push({ name: 'templates' })
}

async function createNewTemplateWithItems(): Promise<void> {
  const template = await templatesStore.addTemplate({
    name: form.value.name,
    duration: form.value.duration,
    total: totalAmount.value,
  })

  if (!template) return

  const items = getCategoryItemsForSave().map((item) => ({
    ...item,
    template_id: template.id,
  }))

  await templatesStore.addCategoriesToTemplate(items)
}

async function updateExistingTemplateWithItems(): Promise<void> {
  if (!routeTemplateId.value || !currentTemplate.value) return

  const template = await templatesStore.editTemplate(routeTemplateId.value, {
    name: form.value.name,
    duration: form.value.duration,
    total: totalAmount.value,
  })

  if (!template) return

  const existingItemIds = currentTemplate.value.template_categories.map((item) => item.id)
  await templatesStore.removeCategoriesFromTemplate(existingItemIds)

  const items = getCategoryItemsForSave().map((item) => ({
    ...item,
    template_id: template.id,
  }))

  if (items.length > 0) {
    await templatesStore.addCategoriesToTemplate(items)
  }
}

async function saveTemplate(): Promise<void> {
  const isValid = await templateForm.value?.validate()

  if (!isValid) return
  if (!validateCategoryItems()) return

  if (isNewTemplate.value) {
    await createNewTemplateWithItems()
  } else {
    await updateExistingTemplateWithItems()
  }

  goBack()
}

async function loadTemplate(): Promise<void> {
  if (isNewTemplate.value || !routeTemplateId.value) return

  currentTemplate.value = await templatesStore.loadTemplateWithItems(routeTemplateId.value)

  if (!currentTemplate.value) return

  form.value.name = currentTemplate.value.name
  form.value.duration = currentTemplate.value.duration

  const items = currentTemplate.value.template_categories.reduce((acc, item) => {
    const category = categoriesStore.getCategoryById(item.category_id)

    if (category) {
      acc.push({
        id: item.id,
        categoryId: item.category_id,
        amount: item.amount,
        color: category.color,
      })
    }

    return acc
  }, [] as TemplateCategoryItem[])

  loadCategoryItems(items)
}

function openShareDialog(): void {
  isShareDialogOpen.value = true
}

function onTemplateShared(): void {
  // Refresh templates to show updated share counts
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
