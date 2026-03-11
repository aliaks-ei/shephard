<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import { dismissBootScreen } from 'src/utils/boot-screen'

onMounted(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dismissBootScreen()
    })
  })
})
</script>
