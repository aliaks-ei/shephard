<template>
  <q-card
    flat
    bordered
    class="q-mb-md"
  >
    <q-expansion-item
      v-model="isExpanded"
      icon="eva-pricetags-outline"
      :label="categoryName"
      :caption="groupCaption"
      header-class="text-weight-medium"
      expand-icon="eva-chevron-down-outline"
      expanded-icon="eva-chevron-up-outline"
    >
      <template #header>
        <q-item-section avatar>
          <q-avatar
            size="sm"
            :style="{ backgroundColor: categoryColor }"
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
          <TemplateCategoryItem
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
          class="q-pt-md"
        >
          <q-btn
            flat
            color="primary"
            icon="eva-plus-outline"
            label="Add Item"
            @click="$emit('add-item', categoryId)"
          />
        </div>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TemplateCategoryItem from './TemplateCategoryItem.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { TemplateCategoryItem as TemplateCategoryItemType } from 'src/api'

const emit = defineEmits<{
  (e: 'update-item', itemId: string, item: TemplateCategoryItemType): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string): void
}>()

interface Props {
  categoryId: string
  categoryName: string
  categoryColor: string
  items: TemplateCategoryItemType[]
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

function handleUpdateItem(itemId: string, updatedItem: TemplateCategoryItemType): void {
  emit('update-item', itemId, updatedItem)
}
</script>
