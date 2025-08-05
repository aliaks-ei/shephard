<template>
  <div class="row items-center justify-between q-mb-md">
    <div class="row items-center text-h6 text-weight-medium">
      <q-icon
        :name="icon"
        class="q-mr-sm"
      />
      {{ title }}
      <q-chip
        :label="items.length"
        :color="chipColor"
        text-color="white"
        size="sm"
        class="q-ml-sm"
      />
    </div>
  </div>

  <div class="row q-col-gutter-md">
    <div
      v-for="item in items"
      :key="item.id"
      class="col-12 col-sm-6 col-lg-4 col-xl-3"
    >
      <slot
        name="item-card"
        :item="item"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="ItemType extends { id: string }">
withDefaults(
  defineProps<{
    items: ItemType[]
    title: string
    icon?: string
    chipColor?: string
  }>(),
  {
    icon: 'eva-grid-outline',
    chipColor: 'primary',
  },
)
</script>
