<template>
  <q-card class="q-mb-sm shadow-1">
    <q-expansion-item
      v-model="isExpanded"
      :label="categoryName"
      :caption="groupCaption"
      :icon="categoryIcon"
      expand-icon="eva-chevron-down-outline"
      expanded-icon="eva-chevron-up-outline"
    >
      <template #header>
        <q-item-section avatar>
          <q-avatar
            :style="{ backgroundColor: categoryColor }"
            size="sm"
            text-color="white"
          >
            <q-icon :name="categoryIcon" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ categoryName }}</q-item-label>
          <q-item-label caption>
            {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="text-right">
            <div class="text-weight-bold text-primary">{{ formattedSubtotal }}</div>
            <div class="text-caption text-grey-6">subtotal</div>
          </div>
        </q-item-section>
      </template>

      <q-card-section class="q-pt-none">
        <q-list>
          <PlanItem
            v-for="item in items"
            :key="item.id"
            :model-value="item"
            :currency="currency"
            :readonly="!!readonly"
            @update:model-value="
              (updatedItem: PlanItemUI) => handleUpdateItem(item.id, updatedItem)
            "
            @remove="$emit('remove-item', item.id)"
          />
        </q-list>

        <div
          v-if="!readonly"
          class="q-pt-sm"
        >
          <q-btn
            flat
            color="primary"
            icon="eva-plus-outline"
            label="Add Item"
            no-caps
            @click="$emit('add-item', categoryId, categoryColor)"
          />
        </div>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PlanItem from './PlanItem.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { PlanItemUI } from 'src/types'

const emit = defineEmits<{
  (e: 'update-item', itemId: string, item: PlanItemUI): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

interface Props {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  items: PlanItemUI[]
  currency: CurrencyCode
  readonly?: boolean
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  defaultExpanded: false,
})

const isExpanded = ref(props.defaultExpanded)

const itemCount = computed(() => props.items.length)
const subtotal = computed(() => props.items.reduce((sum, item) => sum + item.amount, 0))
const formattedSubtotal = computed(() => formatCurrency(subtotal.value, props.currency))
const groupCaption = computed(() => {
  const count = itemCount.value
  return `${count} ${count === 1 ? 'item' : 'items'} • ${formattedSubtotal.value}`
})

function handleUpdateItem(itemId: string, updatedItem: PlanItemUI): void {
  emit('update-item', itemId, updatedItem)
}

watch(
  () => props.defaultExpanded,
  (newValue) => {
    isExpanded.value = newValue
  },
)
</script>
