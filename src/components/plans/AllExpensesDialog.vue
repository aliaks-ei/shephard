<template>
  <AppDialogShell
    :model-value="modelValue"
    title="Expense History"
    body-class="q-pa-none"
    :body-scrollable="false"
    mobile-body-card-surface
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header-prefix>
      <q-icon
        name="eva-list-outline"
        size="32px"
        class="q-mr-sm"
      />
    </template>

    <q-scroll-area
      ref="scrollAreaRef"
      :style="$q.screen.lt.md ? 'height: 100%' : 'height: 550px'"
      :class="[$q.screen.lt.md ? 'q-px-sm full-height' : 'q-px-md', 'q-py-sm']"
    >
      <div
        v-if="isLoading"
        class="row justify-center q-pa-lg"
      >
        <q-spinner color="primary" />
      </div>

      <QueryErrorState
        v-else-if="hasLoadError"
        compact
        entity-name="Expense history"
        :retrying="isRetrying ?? false"
        @retry="emit('retry')"
      />

      <q-virtual-scroll
        v-else
        :items="expenses"
        virtual-scroll-item-size="52"
        virtual-scroll-slice-size="10"
        :scroll-target="scrollTarget"
      >
        <template #default="{ item: expense, index }">
          <ExpenseListItem
            :key="expense.id"
            :expense="expense"
            :currency="currency"
            :can-edit="canEdit"
            show-category
            :category-name="getCategoryName(expense.category_id)"
            :category-color="getCategoryColor(expense.category_id)"
            :category-icon="getCategoryIcon(expense.category_id)"
            :class="index > 0 ? 'q-border-top' : ''"
            item-class="q-px-none q-py-sm"
            @deleted="emit('refresh')"
          />
        </template>
      </q-virtual-scroll>

      <div
        v-if="!isLoading && !hasLoadError && hasMore"
        class="row justify-center q-py-md"
      >
        <q-btn
          flat
          no-caps
          color="primary"
          label="Load more"
          :loading="isLoadingMore"
          @click="emit('load-more')"
        />
      </div>
    </q-scroll-area>
  </AppDialogShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { QScrollArea } from 'quasar'
import AppDialogShell from 'src/components/shared/AppDialogShell.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import ExpenseListItem from 'src/components/expenses/ExpenseListItem.vue'
import { type CurrencyCode } from 'src/utils/currency'
import { useCategoryHelpers } from 'src/composables/useCategoryHelpers'
import type { ExpenseWithCategory } from 'src/api'

defineProps<{
  modelValue: boolean
  expenses: ExpenseWithCategory[]
  currency: CurrencyCode
  canEdit: boolean
  planId?: string
  isLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  hasLoadError?: boolean
  isRetrying?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  refresh: []
  'load-more': []
  retry: []
}>()

const { getCategoryName, getCategoryColor, getCategoryIcon } = useCategoryHelpers()

const scrollAreaRef = ref<InstanceType<typeof QScrollArea>>()
const scrollTarget = ref<Element>()

onMounted(() => {
  scrollTarget.value = scrollAreaRef.value?.getScrollTarget?.()
})
</script>
