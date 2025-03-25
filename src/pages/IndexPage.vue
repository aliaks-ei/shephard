<template>
  <q-page class="row items-center justify-evenly">
    <h4> Hello {{ authStore.user?.email }} </h4>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth';

const authStore = useAuthStore();
</script>
