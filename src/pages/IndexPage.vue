<template>
  <q-page class="row items-center justify-evenly">
    <q-card
      class="user-profile-card shadow-2"
      style="width: 350px"
    >
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <div
            v-if="authStore.user?.user_metadata?.avatar_url"
            class="col-auto q-mr-md"
          >
            <q-avatar size="72px">
              <q-img :src="authStore.user?.user_metadata?.avatar_url" />
            </q-avatar>
          </div>
          <div
            v-else
            class="col-auto q-mr-md"
          >
            <q-avatar
              color="grey-4"
              text-color="primary"
              size="72px"
            >
              {{ getFirstLetter(authStore.user?.email || '') }}
            </q-avatar>
          </div>
          <div class="col">
            <div class="text-h6 q-mb-xs">{{ getUserName() }}</div>
            <div class="text-caption">{{ authStore.user?.email }}</div>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon
                name="email"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>Email</q-item-label>
              <q-item-label caption>{{ authStore.user?.email }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="authStore.user?.user_metadata?.full_name">
            <q-item-section avatar>
              <q-icon
                name="person"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>Full Name</q-item-label>
              <q-item-label caption>{{ authStore.user?.user_metadata?.full_name }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon
                name="fingerprint"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>User ID</q-item-label>
              <q-item-label
                caption
                class="ellipsis"
                >{{ authStore.user?.id }}</q-item-label
              >
            </q-item-section>
          </q-item>

          <q-item v-if="authStore.user?.app_metadata?.provider">
            <q-item-section avatar>
              <q-icon
                name="login"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>Sign-in Provider</q-item-label>
              <q-item-label caption>{{ authStore.user?.app_metadata?.provider }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          color="negative"
          icon="logout"
          label="Sign Out"
          flat
          :loading="isSigningOut"
          @click="handleSignOut"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isSigningOut = ref(false)

function getFirstLetter(email: string): string {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}

function getUserName(): string {
  // Try to get the name from different possible metadata locations
  const fullName = authStore.user?.user_metadata?.full_name || authStore.user?.user_metadata?.name

  if (fullName) return fullName

  // Fall back to email if no name is available
  const email = authStore.user?.email || ''
  const atIndex = email.indexOf('@')

  // Return username part of email or full email if @ not found
  return atIndex > 0 ? email.substring(0, atIndex) : email
}

async function handleSignOut() {
  isSigningOut.value = true
  try {
    const { error } = await authStore.signOut()
    if (error) {
      throw new Error('Failed to sign out')
    }

    // Redirect to auth page
    await router.push('/auth')
  } catch (error) {
    console.error('Error signing out:', error)
  } finally {
    isSigningOut.value = false
  }
}
</script>

<style scoped>
.user-profile-card {
  border-radius: 12px;
  overflow: hidden;
}
</style>
