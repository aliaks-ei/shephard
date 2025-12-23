<template>
  <div
    v-if="!$q.screen.lt.md"
    class="q-mb-lg"
  >
    <h1 class="text-weight-medium q-my-none text-h4">
      {{ greeting }}
    </h1>
    <p class="q-ma-none text-grey-6 text-body1">What would you like to do today?</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from 'src/stores/user'

const userStore = useUserStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  let timeGreeting: string

  if (hour < 12) {
    timeGreeting = 'Morning'
  } else if (hour < 18) {
    timeGreeting = 'Afternoon'
  } else {
    timeGreeting = 'Evening'
  }

  const displayName = userStore.userProfile?.displayName || ''
  const firstName = displayName.split(' ')[0] || displayName || 'there'

  return `${timeGreeting}, ${firstName}`
})
</script>
