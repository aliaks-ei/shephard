<template>
  <q-btn
    round
    flat
  >
    <UserAvatar />

    <q-menu>
      <q-list style="min-width: 220px">
        <div class="text-center q-pt-md q-pb-md">
          <UserAvatar size="72px" />
          <p class="text-center q-mt-sm text-weight-bold text-h6">
            {{ userStore.userProfile?.displayName }}
          </p>
          <p class="text-center text-caption">
            {{ userStore.userProfile?.email }}
          </p>
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
          class="q-py-md text-negative"
          clickable
          v-ripple
          @click="signOut"
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
import { useUserStore } from 'src/stores/user'
import UserAvatar from './UserAvatar.vue'

const userStore = useUserStore()
const router = useRouter()

const signOut = async () => {
  await userStore.signOut()
  router.push('/auth')
}
</script>
