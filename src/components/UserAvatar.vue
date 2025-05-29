<template>
  <q-avatar
    v-if="userStore.userProfile?.avatarUrl"
    :size="size"
  >
    <q-img
      :src="userStore.userProfile.avatarUrl"
      :ratio="1"
      no-spinner
      loading="eager"
    />
  </q-avatar>
  <q-avatar
    v-else
    :color="color"
    :text-color="textColor"
    :size="size"
  >
    {{ userStore.userProfile?.nameInitial || '?' }}
  </q-avatar>
</template>

<script setup lang="ts">
import { useUserStore } from 'src/stores/user'

interface UserAvatarProps {
  size?: string
  color?: string
  textColor?: string
}

withDefaults(defineProps<UserAvatarProps>(), {
  size: '40px',
  color: 'grey-4',
  textColor: 'primary',
})

const userStore = useUserStore()
</script>
