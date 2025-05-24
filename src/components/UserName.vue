<template>
  <span>{{ displayName }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@supabase/supabase-js'

const props = defineProps<{
  user: User | null
}>()

const displayName = computed(() => {
  if (!props.user) return ''

  // Try to get the name from different possible metadata locations
  const fullName = props.user.user_metadata?.full_name || props.user.user_metadata?.name

  if (fullName) return fullName

  // Fall back to email if no name is available
  const email = props.user.email || ''
  const atIndex = email.indexOf('@')

  // Return username part of email or full email if @ not found
  return atIndex > 0 ? email.substring(0, atIndex) : email
})
</script>
