<template>
  <div>
    <!-- Header with Statistics -->
    <q-card
      class="bg-transparent"
      flat
    >
      <q-card-section :class="$q.screen.lt.md ? 'q-px-sm' : 'q-px-md'">
        <!-- Responsive Title and Progress Layout -->
        <div class="row items-center q-col-gutter-md">
          <!-- Title -->
          <div class="col-12 col-md-4">
            <div class="row items-center">
              <q-icon
                name="eva-checkmark-square-2-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 q-my-none">Items Progress</h2>
            </div>
          </div>

          <!-- Progress Bar with Status -->
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <div class="col">
                <q-linear-progress
                  :value="overallProgress"
                  color="primary"
                  size="md"
                  class="rounded-borders"
                />
              </div>
              <div class="col-auto">
                <div class="text-subtitle2 text-weight-medium">
                  {{ completedItemsCount }} of {{ totalItemsCount }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card
      class="bg-transparent"
      flat
    >
      <!-- Loading State -->
      <q-card-section
        v-if="!plan"
        class="q-gutter-sm q-px-none"
      >
        <!-- Skeleton for category groups -->
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
                v-for="j in $q.screen.lt.md ? 2 : 3"
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
      </q-card-section>

      <!-- Empty State -->
      <q-card-section
        v-else-if="categoryGroups.length === 0"
        class="text-center q-py-xl q-px-none"
      >
        <q-icon
          name="eva-checkmark-square-2-outline"
          size="64px"
          class="text-grey-4 q-mb-md"
        />
        <div class="text-h6 text-grey-6 q-mb-sm">No Items to Track</div>
        <div class="text-body2 text-grey-6">This plan doesn't have any items to track yet.</div>
      </q-card-section>

      <!-- Items by Category -->
      <q-card-section
        v-else
        class="q-gutter-sm q-px-none"
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
                  {{ group.items.length + group.nonFixedItems.length }}
                  {{ group.items.length + group.nonFixedItems.length === 1 ? 'item' : 'items' }}
                </q-item-label>
              </q-item-section>

              <q-item-section
                v-if="group.items.length > 0"
                side
              >
                <div class="row items-center q-gutter-xs">
                  <div class="text-caption text-weight-bold text-primary">
                    {{ group.completedCount }}/{{ group.items.length }}
                  </div>
                  <div
                    v-if="!$q.screen.lt.sm"
                    class="text-caption text-grey-6"
                  >
                    completed
                  </div>
                </div>
              </q-item-section>
            </template>

            <q-card-section class="q-pt-none">
              <q-list>
                <!-- Fixed payment items (trackable with checkbox) -->
                <q-item
                  v-for="item in group.items"
                  :key="item.id"
                  clickable
                  :dense="$q.screen.lt.md"
                  @click="handleToggleItemCompletion(item)"
                  class="q-px-sm"
                  :class="item.is_completed ? 'text-strike' : ''"
                >
                  <q-item-section
                    style="min-width: auto"
                    avatar
                  >
                    <q-checkbox
                      :model-value="item.is_completed"
                      dense
                      @update:model-value="(value) => handleToggleItemCompletion(item, value)"
                      :disable="!canEdit"
                      color="primary"
                    />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label :class="item.is_completed ? 'text-grey-6' : 'text-weight-medium'">
                      {{ item.name }}
                    </q-item-label>
                    <q-item-label caption>
                      <span :class="item.is_completed ? 'text-grey-5' : ''">
                        {{ formatCurrency(item.amount, currency) }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <!-- Non-fixed items (read-only reference) -->
                <template v-if="group.nonFixedItems.length > 0">
                  <q-separator
                    v-if="group.items.length > 0"
                    class="q-my-sm"
                  />
                  <q-item-label
                    header
                    class="text-caption q-py-xs q-px-sm"
                    :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'"
                  >
                    For Reference
                  </q-item-label>

                  <q-item
                    v-for="item in group.nonFixedItems"
                    :key="item.id"
                    :dense="$q.screen.lt.md"
                    class="q-px-sm text-grey-6"
                  >
                    <q-item-section
                      style="min-width: auto"
                      avatar
                    >
                      <q-icon
                        name="eva-bookmark-outline"
                        size="24px"
                        :class="$q.dark.isActive ? 'text-grey-6' : 'text-grey-5'"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'">
                        {{ item.name }}
                      </q-item-label>
                      <q-item-label caption>
                        <span :class="$q.dark.isActive ? 'text-grey-6' : 'text-grey-7'">
                          {{ formatCurrency(item.amount, currency) }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>
            </q-card-section>
          </q-expansion-item>
        </q-card>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { useCategoriesQuery } from 'src/queries/categories'
import { useItemCompletion } from 'src/composables/useItemCompletion'
import {
  groupTrackablePlanItemsByCategory,
  useTrackablePlanItems,
  type TrackableCategoryGroup,
} from 'src/composables/useTrackablePlanItems'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { PlanItem } from 'src/api/plans'
import type { PlanWithItems } from 'src/api'

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  canEdit: boolean
  currency: CurrencyCode
}>()

const emit = defineEmits<{
  'add-expense': [categoryId?: string, itemId?: string]
  refresh: []
}>()

const { getCategoryById } = useCategoriesQuery()
const planIdRef = computed(() => props.plan?.id ?? null)
const { toggleItemCompletion: toggleCompletion } = useItemCompletion(planIdRef)

const planItems = computed(() => props.plan?.plan_items ?? [])
const { totalItemsCount, completedItemsCount } = useTrackablePlanItems(planItems)
const categoryGroups = computed((): TrackableCategoryGroup[] =>
  groupTrackablePlanItemsByCategory(planItems.value, getCategoryById),
)

const overallProgress = computed(() => {
  if (totalItemsCount.value === 0) return 0
  return completedItemsCount.value / totalItemsCount.value
})

function handleToggleItemCompletion(item: PlanItem, value?: boolean) {
  if (!props.canEdit) return
  toggleCompletion(item, value, () => emit('refresh'))
}
</script>
