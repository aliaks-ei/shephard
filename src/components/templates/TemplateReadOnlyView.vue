<template>
  <div>
    <TemplateBasicInfoSection
      :model-value="form"
      readonly
    />

    <CategoryItemsManager
      :category-groups="categoryGroups"
      :categories="categories"
      :total-amount="totalAmount"
      :currency="currency"
      header-icon="eva-grid-outline"
      header-title="Categories"
      :all-expanded="allExpanded"
      :show-duplicate-warning="false"
      show-item-count
      amount-size-mobile="text-h5"
      amount-size-desktop="text-h4"
      @toggle-expand="$emit('toggle-expand')"
    >
      <template #empty-state>
        <div class="text-center q-py-xl">
          <q-icon
            name="eva-grid-outline"
            size="4rem"
            class="text-grey-4 q-mb-md"
          />
          <div class="text-h6 q-mb-sm text-grey-6">No categories</div>
          <div class="text-body2 text-grey-5 q-mb-lg">This template doesn't have any items yet</div>
        </div>
      </template>

      <template #category="{ category }">
        <TemplateCategory
          :category-id="category.categoryId"
          :category-name="category.categoryName"
          :category-color="category.categoryColor"
          :category-icon="category.categoryIcon"
          :items="category.items"
          :currency="currency"
          :default-expanded="allExpanded"
          readonly
        />
      </template>
    </CategoryItemsManager>
  </div>
</template>

<script setup lang="ts">
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
}

defineProps<Props>()

defineEmits<{
  (e: 'toggle-expand'): void
}>()
</script>
