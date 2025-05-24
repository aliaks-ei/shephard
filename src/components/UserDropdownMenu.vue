<template>
  <q-btn
    round
    flat
  >
    <UserAvatar :user="user" />

    <q-menu>
      <q-list style="min-width: 220px">
        <div class="text-center q-pt-md q-pb-md">
          <UserAvatar
            :user="user"
            size="72px"
          />
          <div class="text-center q-mt-sm text-weight-bold text-h6">
            <UserName :user="user" />
          </div>
          <div class="text-center text-caption">
            {{ user?.email }}
          </div>
        </div>

        <q-separator />

        <q-item
          clickable
          v-ripple
          to="/settings"
          exact
          class="q-py-md"
        >
          <q-item-section avatar>
            <q-icon
              name="settings"
              size="sm"
            />
          </q-item-section>
          <q-item-section>Settings</q-item-section>
        </q-item>

        <q-separator />

        <q-item
          clickable
          v-ripple
          @click="signOut"
          class="q-py-md text-negative"
        >
          <q-item-section avatar>
            <q-icon
              name="logout"
              size="sm"
              color="negative"
            />
          </q-item-section>
          <q-item-section>Sign Out</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import UserAvatar from './UserAvatar.vue'
import UserName from './UserName.vue'
import type { User } from '@supabase/supabase-js'

defineProps<{
  user: User | null
}>()

const authStore = useAuthStore()
const router = useRouter()

const signOut = async () => {
  await authStore.signOut()
  router.push('/auth')
}
</script>
