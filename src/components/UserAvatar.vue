<template>
  <q-avatar
    v-if="avatarUrl && !imageError"
    :size="size"
  >
    <q-img
      :src="avatarUrl"
      :ratio="1"
      no-spinner
      alt=""
      referrerpolicy="no-referrer"
      crossorigin="anonymous"
      @error="imageError = true"
    />
  </q-avatar>
  <q-avatar
    v-else
    color="grey-4"
    text-color="primary"
    :size="size"
  >
    {{ nameInitial }}
  </q-avatar>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface UserAvatarProps {
  avatarUrl: string | undefined
  nameInitial: string | undefined
  size?: string
}

withDefaults(defineProps<UserAvatarProps>(), {
  size: '40px',
  nameInitial: '?',
})

const imageError = ref(false)
</script>
