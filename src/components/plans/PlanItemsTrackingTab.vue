<template>
  <div>
    <!-- Header with Statistics -->
    <q-card flat>
      <q-card-section class="q-pb-sm">
        <!-- Responsive Title and Progress Layout -->
        <div class="row items-center q-col-gutter-md">
          <!-- Title -->
          <div class="col-12 col-md-4">
            <div class="text-h6">
              <q-icon
                name="eva-checkmark-square-2-outline"
                class="q-mr-sm"
              />
              Items Progress
            </div>
          </div>

          <!-- Progress Bar with Status -->
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <div class="col">
                <q-linear-progress
                  :value="overallProgress"
                  color="primary"
                  size="12px"
                  class="rounded-borders"
                />
              </div>
              <div class="col-auto">
                <div class="text-subtitle2 text-weight-medium">
                  {{ completedItems }} of {{ totalItems }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Loading State -->
      <q-card-section
        v-if="!props.plan"
        class="q-gutter-sm"
      >
        <!-- Skeleton for category groups -->
        <div
          v-for="i in 2"
          :key="i"
          class="q-mb-sm"
        >
          <q-card class="shadow-1">
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
                v-for="j in 3"
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
        class="text-center q-py-xl"
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
        class="q-gutter-sm"
      >
        <q-card
          v-for="group in categoryGroups"
          :key="group.categoryId"
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
                <q-avatar
                  :style="{ backgroundColor: group.categoryColor }"
                  size="sm"
                  text-color="white"
                >
                  <q-icon :name="group.categoryIcon || 'eva-folder-outline'" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ group.categoryName }}
                </q-item-label>
                <q-item-label caption>
                  {{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'items' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
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
                <q-item
                  v-for="item in group.items"
                  :key="item.id"
                  clickable
                  class="q-pa-sm"
                  @click="toggleItemCompletion(item)"
                  :class="item.is_completed ? 'text-strike' : ''"
                >
                  <q-item-section avatar>
                    <q-checkbox
                      :model-value="item.is_completed"
                      @update:model-value="(value) => toggleItemCompletion(item, value)"
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
import { useCategoriesStore } from 'src/stores/categories'
import { useExpensesStore } from 'src/stores/expenses'
import { useNotificationStore } from 'src/stores/notification'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { updatePlanItemCompletion } from 'src/api/plans'
import type { PlanItem } from 'src/api/plans'
import type { PlanWithItems } from 'src/api'

interface CategoryGroup {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  items: PlanItem[]
  totalPlanned: number
  completedCount: number
}

const props = defineProps<{
  plan: (PlanWithItems & { permission_level?: string }) | null
  canEdit: boolean
  currency: CurrencyCode
}>()

const emit = defineEmits<{
  (e: 'add-expense', categoryId?: string, itemId?: string): void
  (e: 'refresh'): void
}>()

const categoriesStore = useCategoriesStore()
const expensesStore = useExpensesStore()
const notificationStore = useNotificationStore()

// Plan items are now available from props.plan.plan_items (loaded at plan level)
const planItems = computed(() => props.plan?.plan_items || [])

const categoryGroups = computed((): CategoryGroup[] => {
  if (!planItems.value.length) return []

  const groups = new Map<string, CategoryGroup>()

  for (const item of planItems.value) {
    if (!groups.has(item.category_id)) {
      const category = categoriesStore.getCategoryById(item.category_id)
      if (!category) continue

      groups.set(item.category_id, {
        categoryId: item.category_id,
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon,
        items: [],
        totalPlanned: 0,
        completedCount: 0,
      })
    }

    // Add the current item to the group
    const group = groups.get(item.category_id)!
    group.items.push(item)
    group.totalPlanned += item.amount

    if (item.is_completed) {
      group.completedCount++
    }
  }

  // Sort items: incomplete first, then completed
  for (const group of groups.values()) {
    group.items.sort((a, b) => {
      const aCompleted = a.is_completed
      const bCompleted = b.is_completed
      if (aCompleted === bCompleted) return 0
      return aCompleted ? 1 : -1 // incomplete items first
    })
  }

  return Array.from(groups.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName))
})

const totalItems = computed(() => planItems.value.length)
const completedItems = computed(() => planItems.value.filter((item) => item.is_completed).length)

const overallProgress = computed(() => {
  if (totalItems.value === 0) return 0
  return completedItems.value / totalItems.value
})

async function toggleItemCompletion(item: PlanItem, value?: boolean) {
  if (!props.canEdit || !props.plan?.id) return

  const newCompletionState = value !== undefined ? value : !item.is_completed

  try {
    if (newCompletionState) {
      // CHECKING the item - create expense
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const expenseDate = `${year}-${month}-${day}`

      item.is_completed = newCompletionState

      await expensesStore.addExpense({
        plan_id: props.plan.id,
        category_id: item.category_id,
        name: item.name,
        amount: item.amount,
        expense_date: expenseDate,
        plan_item_id: item.id,
      })

      notificationStore.showSuccess(`${item.name} marked as completed!`)
    } else {
      // UNCHECKING the item - delete associated expense(s)
      const expensesToDelete = expensesStore.expenses.filter(
        (expense) => expense.plan_item_id === item.id,
      )

      if (expensesToDelete.length === 0) {
        notificationStore.showWarning('No expenses found to remove for this item')
        return
      }

      item.is_completed = newCompletionState

      // Delete all expenses linked to this plan item
      for (const expense of expensesToDelete) {
        await expensesStore.removeExpense(expense.id)
      }

      notificationStore.showSuccess(`${item.name} unmarked as completed!`)
    }

    // Update the database completion state
    await updatePlanItemCompletion(item.id, newCompletionState)

    // Refresh plan data to get updated values
    emit('refresh')
  } catch {
    item.is_completed = !newCompletionState
    const action = newCompletionState ? 'completed' : 'incomplete'
    notificationStore.showError(`Failed to mark item as ${action}. Please try again.`)
  }
}
</script>
