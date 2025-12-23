<template>
  <q-form
    ref="formRef"
    @submit="$emit('submit')"
  >
    <PlanTemplateSelection
      :model-value="selectedTemplateOption"
      :template-options="templateOptions"
      :selected-template="selectedTemplate"
      :loading="templatesLoading"
      :error="templateError"
      :error-message="templateErrorMessage"
      @update:model-value="handleTemplateOptionUpdate"
      @template-selected="handleTemplateSelected"
    />

    <template v-if="selectedTemplateOption">
      <PlanInformationForm
        :model-value="form"
        class="q-mb-md"
        :template-duration="selectedTemplate?.duration ?? ''"
        @update:model-value="handleFormUpdate"
      />

      <CategoryItemsManager
        :category-groups="categoryGroups"
        :categories="categories"
        :total-amount="totalAmount"
        :currency="currency"
        header-icon="eva-list-outline"
        header-title="Plan Items"
        :all-expanded="allExpanded"
        :has-duplicates="hasDuplicates"
        duplicate-banner-position="bottom"
        :duplicate-banner-class="$q.dark.isActive ? 'bg-red-9 text-red-3' : 'bg-red-1 text-red-8'"
        empty-message="Select a template to load plan items"
        amount-size-mobile="text-h5"
        amount-size-desktop="text-h4"
        :bordered="false"
        :padding="false"
        :transparent="true"
        @toggle-expand="$emit('toggle-expand')"
      >
        <template #category="{ category }">
          <PlanCategory
            :ref="(el) => props.setCategoryRef(el, category.categoryId)"
            :category-id="category.categoryId"
            :category-name="category.categoryName"
            :category-color="category.categoryColor"
            :category-icon="category.categoryIcon"
            :items="category.items"
            :currency="currency"
            :default-expanded="
              props.allExpanded || category.categoryId === props.lastAddedCategoryId
            "
            @update-item="handleUpdateItem"
            @remove-item="handleRemoveItem"
            @add-item="handleAddItem"
          />
        </template>
      </CategoryItemsManager>
    </template>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { QForm } from 'quasar'
import PlanTemplateSelection from './PlanTemplateSelection.vue'
import PlanInformationForm from './PlanInformationForm.vue'
import PlanCategory from './PlanCategory.vue'
import CategoryItemsManager from 'src/components/shared/CategoryItemsManager.vue'
import type { Category, TemplateWithItems } from 'src/api'
import type { PlanItemUI } from 'src/types'
import type { CategoryGroup } from 'src/composables/useItemsManager'
import type { CurrencyCode } from 'src/utils/currency'

interface TemplateOption {
  id: string
  name: string
  duration: string
  total: number
  currency: string
  permission_level: string
}

interface Props {
  form: {
    name: string
    startDate: string
    endDate: string
  }
  selectedTemplate: TemplateWithItems | null
  selectedTemplateOption: string | null
  templateOptions: TemplateOption[]
  templatesLoading: boolean
  templateError: boolean
  templateErrorMessage: string
  categoryGroups: CategoryGroup<PlanItemUI>[]
  categories: Category[]
  totalAmount: number
  currency: CurrencyCode
  allExpanded: boolean
  hasDuplicates: boolean
  lastAddedCategoryId: string | null
  setCategoryRef: (el: unknown, categoryId: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'update:form', value: { name: string; startDate: string; endDate: string }): void
  (e: 'update:selectedTemplateOption', value: string | null): void
  (e: 'template-selected', templateId: string | null): void
  (e: 'toggle-expand'): void
  (e: 'update-item', itemId: string, item: PlanItemUI): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

const formRef = ref<QForm>()

function handleFormUpdate(value: { name: string; startDate: string; endDate: string }): void {
  emit('update:form', value)
}

function handleTemplateOptionUpdate(value: string | null): void {
  emit('update:selectedTemplateOption', value)
}

function handleTemplateSelected(templateId: string | null): void {
  emit('template-selected', templateId)
}

function handleUpdateItem(itemId: string, item: PlanItemUI): void {
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
