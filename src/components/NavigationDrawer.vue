<template>
  <q-list>
    <q-item
      v-for="item in items"
      :key="item.label"
      :to="item.to"
      :active="isActive(item.to)"
      clickable
    >
      <q-item-section
        v-if="isMiniMode"
        class="items-center"
      >
        <q-icon
          size="24px"
          :name="item.icon"
        />
        <div class="text-caption q-mt-xs">{{ item.label }}</div>
      </q-item-section>
      <template v-else>
        <q-item-section avatar>
          <q-icon :name="item.icon" />
        </q-item-section>
        <q-item-section> {{ item.label }} </q-item-section>
      </template>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const isActive = (itemTo: string) => {
  if (itemTo === '/') {
    return route.fullPath === '/'
  }

  return route.fullPath.startsWith(itemTo)
}

defineProps<{
  items: {
    icon: string
    label: string
    to: string
  }[]
  isMiniMode?: boolean
}>()
</script>
