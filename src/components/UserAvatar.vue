<template>
  <q-avatar
    v-if="userProfile?.avatarUrl"
    :size="size"
  >
    <q-img
      :src="userProfile.avatarUrl"
      :ratio="1"
      no-spinner
    />
  </q-avatar>
  <q-avatar
    v-else
    color="grey-4"
    text-color="primary"
    :size="size"
  >
    {{ userProfile?.nameInitial || '?' }}
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from 'src/stores/user'

interface UserAvatarProps {
  size?: string
}

withDefaults(defineProps<UserAvatarProps>(), {
  size: '40px',
})

const userStore = useUserStore()
const userProfile = computed(() => userStore.userProfile)
</script>
