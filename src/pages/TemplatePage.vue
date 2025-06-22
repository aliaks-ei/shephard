<template>
  <q-page class="q-pa-md">
    <!-- Enhanced Header with Toolbar -->
    <q-toolbar class="q-mb-lg q-pl-none">
      <q-btn
        flat
        round
        icon="eva-arrow-back-outline"
        @click="goBack"
      />

      <q-toolbar-title>
        <div class="row items-center">
          <q-icon
            :name="isNewTemplate ? 'eva-plus-circle-outline' : 'eva-edit-outline'"
            size="sm"
            class="q-mr-sm"
          />
          {{ isNewTemplate ? 'Create Template' : 'Edit Template' }}
        </div>
      </q-toolbar-title>

      <q-chip
        v-if="!isNewTemplate"
        :label="form.duration"
        color="primary"
        text-color="white"
        icon="eva-calendar-outline"
        class="text-capitalize"
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
        :label="isNewTemplate ? 'New Template' : 'Edit Template'"
        :icon="isNewTemplate ? 'eva-plus-outline' : 'eva-edit-outline'"
      />
    </q-breadcrumbs>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="row justify-center"
    >
      <div class="col-12 col-md-10 col-lg-8">
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
    </div>

    <!-- Enhanced Template Form -->
    <div
      v-else
      class="row justify-center"
    >
      <div class="col-12 col-md-10 col-lg-8">
        <q-form
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
            <div class="q-mb-xl">
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

              <div class="text-subtitle2 q-mb-sm">Duration</div>
              <q-option-group
                v-model="form.duration"
                :options="durationOptions"
                color="primary"
                inline
                class="q-mb-md"
              />
            </div>

            <q-separator class="q-mb-xl" />

            <!-- Categories Section -->
            <div class="q-mb-xl">
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
                <q-list
                  bordered
                  separator
                  class="rounded-borders"
                >
                  <TemplateCategory
                    v-for="item in categoryItems"
                    :key="item.id"
                    :model-value="item"
                    :category-options="getAvailableCategoriesForItem(item.id)"
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
              class="q-mb-xl"
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
                <div class="text-h4 text-primary text-weight-bold">${{ totalAmount }}</div>
              </div>
              <div class="text-body2 text-grey-6 q-mt-sm">
                Total across {{ categoryItems.length }}
                {{ categoryItems.length === 1 ? 'category' : 'categories' }}
              </div>
            </div>

            <!-- Action Buttons -->
            <q-separator class="q-mb-lg" />
            <div class="row q-gutter-md justify-end">
              <q-btn
                flat
                label="Discard"
                color="grey-8"
                @click="goBack"
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
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { QForm } from 'quasar'

import TemplateCategory from 'src/components/TemplateCategory.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import { useTemplateCategoryItems } from 'src/composables/useTemplateCategoryItems'
import type { TemplateWithCategories, TemplateCategoryItem } from 'src/api'

const route = useRoute()
const router = useRouter()
const templatesStore = useTemplatesStore()
const categoriesStore = useCategoriesStore()
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
const currentTemplate = ref<TemplateWithCategories | null>(null)
const form = ref({
  name: '',
  duration: 'monthly' as string,
})

const isNewTemplate = computed(() => route.name === 'new-template')
const routeTemplateId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id : null,
)

const durationOptions = [
  {
    label: 'Weekly',
    value: 'weekly',
    icon: 'eva-calendar-outline',
  },
  {
    label: 'Monthly',
    value: 'monthly',
    icon: 'eva-calendar-outline',
  },
  {
    label: 'Yearly',
    value: 'yearly',
    icon: 'eva-calendar-outline',
  },
]

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
