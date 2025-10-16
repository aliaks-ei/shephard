<template>
  <q-form
    ref="formRef"
    @submit="handleSubmit"
  >
    <TemplateBasicInfoSection
      :model-value="form"
      :name-error="nameError"
      :name-error-message="nameErrorMessage"
      @update:model-value="handleFormUpdate"
      @clear-name-error="handleClearNameError"
    />

    <CategoryItemsManager
      :category-groups="categoryGroups"
      :categories="categories"
      :total-amount="totalAmount"
      :currency="currency"
      header-icon="eva-grid-outline"
      header-title="Categories"
      :all-expanded="allExpanded"
      :has-duplicates="hasDuplicates"
      duplicate-banner-position="top"
      duplicate-banner-class="bg-orange-1 text-orange-8"
      show-item-count
      @toggle-expand="handleToggleExpand"
    >
      <template #header-actions>
        <q-btn
          v-if="!$q.screen.lt.md"
          icon="eva-plus-outline"
          label="Add category"
          color="primary"
          no-caps
          @click="handleOpenCategoryDialog"
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
            @click="handleOpenCategoryDialog"
          />
        </div>
      </template>

      <template #category="{ category }">
        <TemplateCategory
          :ref="(el) => props.setCategoryRef(el, category.categoryId)"
          :category-id="category.categoryId"
          :category-name="category.categoryName"
          :category-color="category.categoryColor"
          :category-icon="category.categoryIcon"
          :items="category.items"
          :currency="currency"
          :readonly="false"
          :default-expanded="props.allExpanded || category.categoryId === props.lastAddedCategoryId"
          @update-item="handleUpdateItem"
          @remove-item="handleRemoveItem"
          @add-item="handleAddItem"
        />
      </template>
    </CategoryItemsManager>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { QForm } from 'quasar'
import TemplateBasicInfoSection from './TemplateBasicInfoSection.vue'
import TemplateCategory from './TemplateCategory.vue'
import CategoryItemsManager from 'src/components/shared/CategoryItemsManager.vue'
import type { Category } from 'src/api'
import type { TemplateItemUI } from 'src/types'
import type { CategoryGroup } from 'src/composables/useItemsManager'
import type { CurrencyCode } from 'src/utils/currency'

interface Props {
  form: {
    name: string
    duration: string
    currency: CurrencyCode
  }
  categoryGroups: CategoryGroup<TemplateItemUI>[]
  categories: Category[]
  totalAmount: number
  currency: CurrencyCode
  allExpanded: boolean
  hasDuplicates: boolean
  nameError: boolean
  nameErrorMessage: string
  lastAddedCategoryId: string | null
  setCategoryRef: (el: unknown, categoryId: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'update:form', value: { name: string; duration: string; currency: CurrencyCode }): void
  (e: 'clear-name-error'): void
  (e: 'toggle-expand'): void
  (e: 'open-category-dialog'): void
  (e: 'update-item', itemId: string, item: TemplateItemUI): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

const formRef = ref<QForm>()

function handleSubmit(): void {
  emit('submit')
}

function handleFormUpdate(value: { name: string; duration: string; currency: CurrencyCode }): void {
  emit('update:form', value)
}

function handleClearNameError(): void {
  emit('clear-name-error')
}

function handleToggleExpand(): void {
  emit('toggle-expand')
}

function handleOpenCategoryDialog(): void {
  emit('open-category-dialog')
}

function handleUpdateItem(itemId: string, item: TemplateItemUI): void {
  emit('update-item', itemId, item)
}

function handleRemoveItem(itemId: string): void {
  emit('remove-item', itemId)
}

function handleAddItem(categoryId: string, categoryColor: string): void {
  emit('add-item', categoryId, categoryColor)
}

defineExpose({
  formRef,
})
</script>
