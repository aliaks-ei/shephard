<template>
  <q-card
    class="q-mb-md"
    flat
    bordered
  >
    <q-expansion-item
      v-model="isExpanded"
      :label="categoryName"
      :caption="groupCaption"
      icon="eva-pricetags-outline"
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
            <q-icon name="eva-pricetags-outline" />
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
          <ExpenseTemplateItem
            v-for="item in items"
            :key="item.id"
            :model-value="item"
            :currency="currency"
            :readonly="!!readonly"
            @update:model-value="(updatedItem) => handleUpdateItem(item.id, updatedItem)"
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
            @click="$emit('add-item', categoryId, categoryColor)"
          />
        </div>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ExpenseTemplateItem from './ExpenseTemplateItem.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { ExpenseTemplateItemUI } from 'src/api'

const emit = defineEmits<{
  (e: 'update-item', itemId: string, item: ExpenseTemplateItemUI): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

interface Props {
  categoryId: string
  categoryName: string
  categoryColor: string
  items: ExpenseTemplateItemUI[]
  subtotal: number
  currency: CurrencyCode
  readonly?: boolean
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  defaultExpanded: true,
})

const isExpanded = ref(props.defaultExpanded)

const itemCount = computed(() => props.items.length)
const formattedSubtotal = computed(() => formatCurrency(props.subtotal, props.currency))
const groupCaption = computed(() => {
  const count = itemCount.value
  return `${count} ${count === 1 ? 'item' : 'items'} • ${formattedSubtotal.value}`
})

function handleUpdateItem(itemId: string, updatedItem: ExpenseTemplateItemUI): void {
  emit('update-item', itemId, updatedItem)
}
</script>
