<template>
  <div class="row q-col-gutter-lg">
    <div
      v-for="n in count"
      :key="n"
      class="col-12 col-sm-6 col-lg-4 col-xl-3"
    >
      <q-card
        flat
        bordered
      >
        <q-card-section>
          <q-skeleton
            type="text"
            width="60%"
            height="24px"
            class="q-mb-sm"
          />
          <q-skeleton
            type="text"
            width="40%"
            height="16px"
            class="q-mb-md"
          />
          <q-skeleton
            type="text"
            width="80%"
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
