<template>
  <div class="row q-col-gutter-lg">
    <div
      v-for="n in count"
      :key="n"
      class="col-12 col-sm-6 col-lg-4 col-xl-3"
    >
      <q-card class="shadow-1">
        <q-card-section>
          <q-skeleton
            type="text"
            width="60%"
            height="24px"
            class="q-mb-lg"
          />
          <q-skeleton
            type="text"
            width="30%"
            height="16px"
            class="q-mb-xs"
          />
          <q-skeleton
            type="text"
            width="80%"
            height="48px"
            class="q-mb-xs"
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
