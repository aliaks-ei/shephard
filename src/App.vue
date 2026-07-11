<template>
  <router-view />
  <PwaUpdateBanner />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMeta } from 'quasar'

import PwaUpdateBanner from 'src/components/PwaUpdateBanner.vue'
import { dismissBootScreen } from 'src/utils/boot-screen'

useMeta({
  title: 'Shephard',
  titleTemplate: (title) => (!title || title === 'Shephard' ? 'Shephard' : `${title} | Shephard`),
  meta: {
    description: {
      name: 'description',
      content: 'Smart budget management and expense tracking',
    },
  },
})

onMounted(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dismissBootScreen()
    })
  })
})
</script>
