<template>
  <router-view />
  <VueQueryDevtools v-if="isDev" />
</template>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

const isDev = import.meta.env.DEV
</script>
