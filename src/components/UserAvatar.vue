<template>
  <div>
    <q-avatar
      v-if="avatarUrl"
      :size="size"
    >
      <q-img
        :src="avatarUrl"
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
      {{ firstLetter }}
    </q-avatar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@supabase/supabase-js'

interface UserAvatarProps {
  user: User | null
  size?: string
  color?: string
  textColor?: string
}

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: '40px',
  color: 'grey-4',
  textColor: 'primary',
})

const avatarUrl = computed(() => props.user?.user_metadata?.avatar_url)

const firstLetter = computed(() => {
  const email = props.user?.email || ''
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
})
</script>
