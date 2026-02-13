<template>
  <div>
    <TemplateBasicInfoSection
      :model-value="form"
      readonly
    />

    <!-- Empty state as separate card when no categories -->
    <q-card
      v-if="categoryGroups.length === 0"
      flat
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-center q-py-xl">
          <q-icon
            name="eva-grid-outline"
            size="4rem"
            class="text-grey-4 q-mb-md"
          />
          <div class="text-h6 q-mb-sm text-grey-6">No categories</div>
          <div class="text-body2 text-grey-5 q-mb-lg">This template doesn't have any items yet</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Categories section when there are items -->
    <template v-else>
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
        :bordered="false"
        :padding="false"
        transparent
        :show-summary="false"
        @toggle-expand="$emit('toggle-expand')"
      >
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

      <!-- Total Amount as separate card -->
      <q-card flat>
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-icon
                name="eva-credit-card-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h3 class="text-h6 q-my-none">Total Amount</h3>
            </div>
            <div
              :class="['text-primary text-weight-bold', $q.screen.lt.md ? 'text-h6' : 'text-h5']"
            >
              {{ formattedTotal }}
            </div>
          </div>
          <div class="text-body2 text-grey-6">
            Total across {{ categoryGroups.length }}
            {{ categoryGroups.length === 1 ? 'category' : 'categories' }}
          </div>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TemplateBasicInfoSection from './TemplateBasicInfoSection.vue'
import TemplateCategory from './TemplateCategory.vue'
import CategoryItemsManager from 'src/components/shared/CategoryItemsManager.vue'
import type { Category } from 'src/api'
import type { TemplateItemUI } from 'src/types'
import type { CategoryGroup } from 'src/composables/useItemsManager'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'

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

const props = defineProps<Props>()

const formattedTotal = computed(() => formatCurrency(props.totalAmount, props.currency))

defineEmits<{
  (e: 'toggle-expand'): void
}>()
</script>
