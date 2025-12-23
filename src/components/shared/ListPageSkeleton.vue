<template>
  <div
    class="row"
    :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
  >
    <div
      v-for="n in count"
      :key="n"
      :class="columnClass"
    >
      <q-card
        :bordered="$q.dark.isActive"
        class="shadow-1 full-height"
      >
        <slot>
          <q-card-section>
            <q-skeleton
              type="text"
              width="60%"
              height="36px"
              class="q-mb-lg"
            />
            <q-skeleton
              type="text"
              width="80%"
              height="24px"
            />
            <q-skeleton
              type="text"
              width="60%"
              height="16px"
            />
          </q-card-section>
        </slot>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
    columnClass?: string
  }>(),
  {
    count: 6,
    columnClass: 'col-12 col-sm-6 col-md-4',
  },
)
</script>
