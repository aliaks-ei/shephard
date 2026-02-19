<template>
  <div>
    <div class="row items-center q-mb-xs">
      <q-icon
        name="eva-checkmark-square-2-outline"
        class="q-mr-sm"
        size="20px"
      />
      <h2 class="text-h6 q-my-none">Quick Select Items</h2>
    </div>

    <div class="text-grey-7 text-caption q-mb-lg">
      Select items from your plan to quickly register expenses. You can modify the amount and
      description after selection.
    </div>

    <div
      v-if="isLoading"
      class="q-gutter-sm"
    >
      <!-- Skeleton for expansion items -->
      <div
        v-for="i in 2"
        :key="i"
        class="q-mb-sm"
      >
        <q-card
          :bordered="$q.dark.isActive"
          class="shadow-1"
        >
          <q-card-section class="q-pb-none">
            <div class="row items-center q-gutter-md">
              <q-skeleton
                type="QAvatar"
                size="40px"
              />
              <div class="col">
                <q-skeleton
                  type="text"
                  width="120px"
                  height="16px"
                  class="q-mb-xs"
                />
                <q-skeleton
                  type="text"
                  width="80px"
                  height="12px"
                />
              </div>
              <q-skeleton
                type="rect"
                width="24px"
                height="24px"
              />
            </div>
          </q-card-section>

          <q-card-section class="q-pt-sm">
            <!-- Skeleton for items -->
            <div
              v-for="j in 2"
              :key="j"
              class="row items-center q-gutter-md q-py-sm"
            >
              <q-skeleton type="QCheckbox" />
              <div class="col">
                <q-skeleton
                  type="text"
                  width="60%"
                  height="16px"
                  class="q-mb-xs"
                />
                <q-skeleton
                  type="text"
                  width="40%"
                  height="12px"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-else-if="categoryGroups.length === 0">
      <q-banner
        dense
        rounded
        class="themed-muted-banner"
      >
        <template #avatar>
          <q-icon
            name="eva-info-outline"
            size="sm"
          />
        </template>
        No items available in this plan for expense registration.
      </q-banner>
    </div>

    <div
      v-else
      class="q-gutter-sm"
    >
      <q-card
        v-for="group in categoryGroups"
        :key="group.categoryId"
        :bordered="$q.dark.isActive"
        class="q-mb-sm shadow-1"
      >
        <q-expansion-item
          :default-opened="true"
          expand-icon="eva-chevron-down-outline"
          expanded-icon="eva-chevron-up-outline"
        >
          <template #header>
            <q-item-section
              style="min-width: auto"
              avatar
            >
              <CategoryIcon
                :color="group.categoryColor"
                :icon="group.categoryIcon || 'eva-folder-outline'"
                size="sm"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ group.categoryName }}
              </q-item-label>
              <q-item-label caption>
                {{ group.availableItems.length }}
                {{ group.availableItems.length === 1 ? 'item' : 'items' }} available
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-xs">
                <div
                  v-if="group.selectedCount > 0"
                  class="text-caption text-weight-medium text-primary"
                >
                  {{ group.selectedCount }} selected
                </div>
              </div>
            </q-item-section>
          </template>

          <q-card-section class="q-pt-none">
            <q-list>
              <q-item
                v-for="item in group.availableItems"
                :key="item.id"
                clickable
                class="q-pa-sm"
                @click="toggleItemSelection(item)"
              >
                <q-item-section
                  style="min-width: auto"
                  avatar
                >
                  <q-checkbox
                    :model-value="isItemSelected(item.id)"
                    color="primary"
                    dense
                    @update:model-value="(val) => toggleItemSelection(item, val)"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ item.name }}</q-item-label>
                  <q-item-label caption>
                    {{ formatCurrency(item.amount, currency) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-expansion-item>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { useCategoriesQuery } from 'src/queries/categories'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { PlanItem } from 'src/api/plans'

interface CategoryGroup {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  availableItems: PlanItem[]
  selectedCount: number
}

const props = defineProps<{
  planItems: PlanItem[]
  currency: CurrencyCode
  isLoading?: boolean
  selectedCategoryId?: string | null
}>()

const emit = defineEmits<{
  (e: 'item-selected', items: PlanItem[]): void
  (e: 'selection-changed', items: PlanItem[]): void
}>()

const $q = useQuasar()
const { getCategoryById } = useCategoriesQuery()

const selectedItemIds = ref<Set<string>>(new Set())

const categoryGroups = computed((): CategoryGroup[] => {
  const groups = new Map<string, CategoryGroup>()

  for (const item of props.planItems) {
    if (!groups.has(item.category_id)) {
      const category = getCategoryById(item.category_id)
      if (!category) continue

      groups.set(item.category_id, {
        categoryId: item.category_id,
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon,
        availableItems: [],
        selectedCount: 0,
      })
    }

    const group = groups.get(item.category_id)!
    group.availableItems.push(item)
  }

  // Update selected counts
  for (const group of groups.values()) {
    group.selectedCount = group.availableItems.filter((item) =>
      selectedItemIds.value.has(item.id),
    ).length
  }

  // Sort groups - prioritize selected category if provided
  return Array.from(groups.values()).sort((a, b) => {
    if (props.selectedCategoryId) {
      if (a.categoryId === props.selectedCategoryId) return -1
      if (b.categoryId === props.selectedCategoryId) return 1
    }
    return a.categoryName.localeCompare(b.categoryName)
  })
})

const selectedItems = computed(() =>
  props.planItems.filter((item) => selectedItemIds.value.has(item.id)),
)

function isItemSelected(itemId: string): boolean {
  return selectedItemIds.value.has(itemId)
}

function toggleItemSelection(item: PlanItem, value?: boolean) {
  const shouldSelect = value !== undefined ? value : !selectedItemIds.value.has(item.id)

  if (shouldSelect) {
    selectedItemIds.value.add(item.id)
  } else {
    selectedItemIds.value.delete(item.id)
  }

  emitSelectionChanged()
}

function emitSelectionChanged() {
  const items = selectedItems.value
  emit('selection-changed', items)
  if (items.length > 0) {
    emit('item-selected', items)
  }
}

// Expose methods to manage selection
defineExpose({
  clearSelection: () => {
    selectedItemIds.value.clear()
    emitSelectionChanged()
  },
  deselectItem: (itemId: string) => {
    selectedItemIds.value.delete(itemId)
    emitSelectionChanged()
  },
})
</script>
