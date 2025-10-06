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
        <q-item-section
          style="min-width: auto"
          avatar
        >
          <CategoryIcon
            :color="categoryColor"
            :icon="categoryIcon"
            size="sm"
          />
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
          <slot
            v-for="(item, index) in items"
            :key="item.id"
            name="item"
            :item="item"
            :index="index"
            :set-item-ref="setItemRef"
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
import { ref, computed, nextTick, watch, watchEffect } from 'vue'
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { BaseItemUI } from 'src/types'

interface ItemComponentRef {
  focusNameInput?: () => void
}

interface Props {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  items: BaseItemUI[]
  currency: CurrencyCode
  readonly?: boolean
  defaultExpanded?: boolean
}

const itemRefs = ref<ItemComponentRef[]>([])

defineEmits<{
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

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

function setItemRef(el: unknown, index: number): void {
  if (el && typeof el === 'object' && 'focusNameInput' in el) {
    const component = el as ItemComponentRef
    if (typeof component.focusNameInput === 'function') {
      itemRefs.value[index] = component
    }
  }
}

async function focusLastItem(): Promise<void> {
  await nextTick()

  const lastItemIndex = props.items.length - 1
  if (lastItemIndex >= 0 && itemRefs.value[lastItemIndex]) {
    itemRefs.value[lastItemIndex].focusNameInput?.()
  }
}

async function focusFirstInvalidItem(): Promise<void> {
  await nextTick()

  const invalidItemIndex = props.items.findIndex((item) => !item.name.trim() || item.amount <= 0)

  if (invalidItemIndex >= 0 && itemRefs.value[invalidItemIndex]) {
    itemRefs.value[invalidItemIndex].focusNameInput?.()
    return
  }

  if (props.items.length > 0 && itemRefs.value[0]) {
    itemRefs.value[0].focusNameInput?.()
  }
}

watch(
  () => props.items.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      focusLastItem()
    }
  },
)

watchEffect(() => {
  isExpanded.value = props.defaultExpanded
})

defineExpose({
  focusLastItem,
  focusFirstInvalidItem,
})
</script>
