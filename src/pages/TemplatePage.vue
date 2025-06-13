<template>
  <q-page class="template-page">
    <div class="q-pa-lg">
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
                no-caps
                unelevated
                toggle-color="primary"
                color="grey-3"
                text-color="grey-8"
                :options="durationOptions"
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
                  @click="addNewCategoryItem"
                />
              </div>

              <!-- Categories List -->
              <div v-if="categoryItems.length > 0">
                <q-list>
                  <q-item
                    v-for="(item, index) in categoryItems"
                    :key="index"
                    dense
                  >
                    <q-item-section avatar>
                      <div
                        class="category-color-indicator"
                        :style="{ backgroundColor: item.color }"
                      ></div>
                    </q-item-section>
                    <q-item-section>
                      <q-select
                        v-model="item.categoryId"
                        :options="getAvailableCategoriesForItem(index)"
                        option-value="id"
                        option-label="name"
                        label="Select category"
                        emit-value
                        map-options
                        :rules="[(val) => !!val || 'Category is required']"
                        @update:model-value="(value) => updateCategorySelection(index, value)"
                      >
                        <template #selected>
                          <span v-if="item.categoryId">{{ getCategoryName(item.categoryId) }}</span>
                        </template>
                        <template #option="{ opt, itemProps }">
                          <q-item v-bind="itemProps">
                            <q-item-section avatar>
                              <div
                                class="category-color-indicator"
                                :style="{ backgroundColor: opt.color }"
                              ></div>
                            </q-item-section>
                            <q-item-section>
                              <q-item-label>{{ opt.name }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </q-item-section>
                    <q-item-section style="max-width: 150px">
                      <q-input
                        v-model.number="item.amount"
                        type="number"
                        min="0"
                        step="0.01"
                        prefix="$"
                        label="Amount"
                        :rules="[
                          (val) => (val !== null && val !== undefined) || 'Amount is required',
                          (val) => val > 0 || 'Amount must be greater than 0',
                        ]"
                      />
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        flat
                        round
                        icon="eva-trash-2-outline"
                        color="negative"
                        @click="removeCategoryItem(index)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { QForm } from 'quasar'

import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import type { TemplateWithCategories } from 'src/api'

const route = useRoute()
const router = useRouter()
const templatesStore = useTemplatesStore()
const categoriesStore = useCategoriesStore()

const templateForm = ref<QForm | null>(null)
const isLoading = ref(false)
const currentTemplate = ref<TemplateWithCategories | null>(null)
const form = ref({
  name: '',
  duration: 'monthly' as string,
})

interface CategoryItem {
  categoryId: string
  amount: number
  color: string
}

const categoryItems = ref<CategoryItem[]>([])

const isNewTemplate = computed(() => route.name === 'new-template')
const routeTemplateId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id : null,
)

const durationOptions = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const totalAmount = computed(() =>
  categoryItems.value.reduce((total, item) => total + item.amount, 0),
)

const getAvailableCategoriesForItem = (currentIndex: number) => {
  const currentItemCategoryId = categoryItems.value[currentIndex]?.categoryId
  const otherUsedCategoryIds = categoryItems.value
    .filter((_, index) => index !== currentIndex)
    .map((item) => item.categoryId)

  return categoriesStore.categories.filter(
    (category) =>
      !otherUsedCategoryIds.includes(category.id) || category.id === currentItemCategoryId,
  )
}

function getCategoryName(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.name || 'Unknown Category'
}

function updateCategorySelection(index: number, categoryId: string): void {
  const category = categoriesStore.getCategoryById(categoryId)
  if (category && categoryItems.value[index]) {
    categoryItems.value[index].categoryId = categoryId
    categoryItems.value[index].color = category.color
  }
}

function goBack(): void {
  router.push({ name: 'templates' })
}

function addNewCategoryItem(): void {
  categoryItems.value.unshift({
    categoryId: '',
    amount: 0,
    color: '#6B7280',
  })
}

function removeCategoryItem(index: number): void {
  categoryItems.value.splice(index, 1)
}

async function createNewTemplateWithItems(): Promise<void> {
  const template = await templatesStore.addTemplate({
    name: form.value.name,
    duration: form.value.duration,
    total: totalAmount.value,
  })

  if (!template) return

  const newTemplateId = template.id
  const items = categoryItems.value.map((item) => ({
    category_id: item.categoryId,
    amount: item.amount,
    template_id: newTemplateId,
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

  const items = categoryItems.value
    .filter((item) => item.categoryId && item.amount > 0)
    .map((item) => ({
      category_id: item.categoryId,
      amount: item.amount,
      template_id: template.id,
    }))

  if (items.length > 0) {
    await templatesStore.addCategoriesToTemplate(items)
  }
}

async function saveTemplate(): Promise<void> {
  const isValid = await templateForm.value?.validate()

  if (!isValid) return
  if (categoryItems.value.length === 0) return

  // Check if all categories are selected and have valid amounts
  const hasValidCategories = categoryItems.value.every((item) => item.categoryId && item.amount > 0)

  if (!hasValidCategories) return

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

  categoryItems.value = currentTemplate.value.template_categories.reduce((acc, item) => {
    const category = categoriesStore.getCategoryById(item.category_id)

    if (category) {
      acc.push({
        categoryId: item.category_id,
        amount: item.amount,
        color: category.color,
      })
    }

    return acc
  }, [] as CategoryItem[])
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

<style scoped>
.template-page {
  min-height: 100vh;
}

.category-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
