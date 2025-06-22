<template>
  <div class="q-pa-sm">
    <!-- Header with back button -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="eva-arrow-back-outline"
        @click="goBack"
      />
      <div class="text-h5 q-ml-md">
        {{ isNewTemplate ? 'Create Template' : 'Edit Template' }}
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="text-center q-py-xl"
    >
      <q-spinner
        color="primary"
        size="3em"
      />
      <div class="text-body1 q-mt-md">Loading template...</div>
    </div>

    <!-- Template form -->
    <div
      v-else
      class="row justify-center"
    >
      <div class="col-12 col-md-10 col-lg-6">
        <q-form
          ref="templateForm"
          @submit="saveTemplate"
        >
          <!-- Template Name -->
          <div class="q-mb-lg">
            <q-input
              v-model="form.name"
              label="Template Name"
              :rules="[(val) => !!val || 'Template name is required']"
            />
          </div>

          <!-- Duration Selector -->
          <div class="q-mb-lg">
            <div class="text-subtitle2 q-mb-sm">Duration</div>
            <q-btn-toggle
              v-model="form.duration"
              :options="durationOptions"
              no-caps
            />
          </div>

          <!-- Categories Section -->
          <div class="q-mb-lg">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2">Categories</div>
              <q-btn
                flat
                icon="eva-plus-outline"
                label="Add new category"
                color="primary"
                @click="addCategoryItem"
              />
            </div>

            <!-- Categories List -->
            <q-list v-if="categoryItems.length > 0">
              <TemplateCategory
                v-for="item in categoryItems"
                :key="item.id"
                :model-value="item"
                :category-options="getAvailableCategoriesForItem(item.id)"
                @update:model-value="(updatedItem) => updateCategoryItem(item.id, updatedItem)"
                @remove="removeCategoryItem(item.id)"
              />
            </q-list>

            <!-- Empty state -->
            <div
              v-else
              class="text-center q-py-lg"
            >
              <q-icon
                name="eva-grid-outline"
                size="3rem"
                class="q-mb-md text-grey-5"
              />
              <div class="text-body1 q-mb-sm">No categories added yet</div>
              <div class="text-body2 text-grey-6">
                Add categories with amounts to build your template
              </div>
            </div>
          </div>

          <!-- Total Amount -->
          <div
            v-if="categoryItems.length > 0"
            class="q-mb-lg"
          >
            <q-separator class="q-mb-md" />
            <div class="row justify-between items-center">
              <div class="text-subtitle1">Total Amount</div>
              <div class="text-h6 text-primary">${{ totalAmount }}</div>
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
              color="primary"
              label="Save Template"
              type="submit"
              :loading="templatesStore.isLoading"
            />
          </div>
        </q-form>
      </div>
    </div>
  </div>
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
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
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
