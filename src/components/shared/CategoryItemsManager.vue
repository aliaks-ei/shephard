<template>
  <CategoryListSection
    :header-icon="headerIcon"
    :header-title="headerTitle"
    :has-categories="enrichedCategories.length > 0"
    :item-count="itemCount ?? 0"
    :show-item-count="showItemCount ?? false"
    :all-expanded="allExpanded ?? false"
    :has-duplicates="hasDuplicates ?? false"
    :show-duplicate-warning="showDuplicateWarning ?? true"
    :duplicate-banner-position="duplicateBannerPosition ?? 'top'"
    :duplicate-banner-class="duplicateBannerClass ?? ''"
    :bordered="bordered ?? true"
    :padding="padding ?? true"
    :transparent="transparent ?? false"
    :empty-message="emptyMessage ?? 'No items yet'"
    @toggle-expand="$emit('toggle-expand')"
  >
    <template #header-actions>
      <slot name="header-actions" />
    </template>

    <template #duplicate-message>
      <slot name="duplicate-message">
        You have duplicate item names within the same category. Please use unique names.
      </slot>
    </template>

    <template #empty-state>
      <slot name="empty-state" />
    </template>

    <template #categories>
      <slot
        name="category"
        v-for="group in enrichedCategories"
        :key="group.categoryId"
        :category="group"
      />
    </template>

    <template #summary>
      <ItemsSummarySection
        :formatted-amount="formattedTotal"
        :item-count="enrichedCategories.length"
        item-type="categories"
        :summary-label="summaryLabel ?? 'Total Amount'"
        :amount-size-mobile="amountSizeMobile ?? 'text-h6'"
        :amount-size-desktop="amountSizeDesktop ?? 'text-h5'"
      />
    </template>
  </CategoryListSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CategoryListSection from './CategoryListSection.vue'
import ItemsSummarySection from './ItemsSummarySection.vue'
import { useEnrichedCategories } from 'src/composables/useEnrichedCategories'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { CategoryGroup } from 'src/composables/useItemsManager'
import type { Category } from 'src/api'
import type { BaseItemUI } from 'src/types'

interface Props<T extends BaseItemUI = BaseItemUI> {
  categoryGroups: CategoryGroup<T>[]
  categories: Category[]
  totalAmount: number
  currency: CurrencyCode
  headerIcon: string
  headerTitle: string
  allExpanded?: boolean
  hasDuplicates?: boolean
  showDuplicateWarning?: boolean
  duplicateBannerPosition?: 'top' | 'bottom'
  duplicateBannerClass?: string
  emptyMessage?: string
  itemCount?: number
  showItemCount?: boolean
  summaryLabel?: string
  amountSizeMobile?: string
  amountSizeDesktop?: string
  bordered?: boolean
  padding?: boolean
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allExpanded: false,
  hasDuplicates: false,
  showDuplicateWarning: true,
  duplicateBannerPosition: 'top',
  duplicateBannerClass: '',
  emptyMessage: 'No items yet',
  itemCount: 0,
  showItemCount: false,
  summaryLabel: 'Total Amount',
  amountSizeMobile: 'text-h6',
  amountSizeDesktop: 'text-h5',
  bordered: true,
  padding: true,
  transparent: false,
})

defineEmits<{
  (e: 'toggle-expand'): void
}>()

const categoryGroupsComputed = computed(() => props.categoryGroups)
const categoriesComputed = computed(() => props.categories)

const { enrichedCategories } = useEnrichedCategories(categoryGroupsComputed, categoriesComputed)

const formattedTotal = computed(() => formatCurrency(props.totalAmount, props.currency))
</script>
