<template>
  <div
    class="row"
    :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
  >
    <div
      v-for="n in count"
      :key="n"
      class="col-12 col-sm-6 col-md-4"
    >
      <q-card
        :bordered="$q.dark.isActive"
        class="shadow-1"
      >
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
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 6,
  },
)
</script>
