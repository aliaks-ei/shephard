<template>
  <q-form
    ref="formRef"
    @submit="$emit('submit')"
  >
    <q-card
      class="bg-transparent"
      flat
    >
      <q-card-section class="q-px-none">
        <PlanInformationForm
          :model-value="form"
          :template-duration="templateDuration"
          @update:model-value="handleFormUpdate"
        />
      </q-card-section>
    </q-card>

    <q-card
      class="bg-transparent"
      flat
    >
      <q-card-section class="q-px-none">
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
          :bordered="false"
          :padding="false"
          transparent
          empty-message="No items in this plan"
          amount-size-mobile="text-h6"
          amount-size-desktop="text-h5"
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
      </q-card-section>
    </q-card>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { QForm } from 'quasar'
import PlanInformationForm from './PlanInformationForm.vue'
import PlanCategory from './PlanCategory.vue'
import CategoryItemsManager from 'src/components/shared/CategoryItemsManager.vue'
import type { Category } from 'src/api'
import type { PlanItemUI } from 'src/types'
import type { CategoryGroup } from 'src/composables/useItemsManager'
import type { CurrencyCode } from 'src/utils/currency'

interface Props {
  form: {
    name: string
    startDate: string
    endDate: string
  }
  templateDuration: string
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
  (e: 'toggle-expand'): void
  (e: 'update-item', itemId: string, item: PlanItemUI): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

const formRef = ref<QForm>()

function handleFormUpdate(value: { name: string; startDate: string; endDate: string }): void {
  emit('update:form', value)
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
