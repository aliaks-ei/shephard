<template>
  <q-page
    padding
    class="row justify-center"
  >
    <div class="col-12 col-md-8 col-lg-6 q-pt-md">
      <!-- User Profile Header -->
      <div class="q-mb-md">
        <div class="row items-center">
          <div class="col-auto q-mr-lg">
            <UserAvatar
              :user="authStore.user"
              size="100px"
            />
          </div>
          <div class="col">
            <div class="text-h4 q-mb-xs section-title"><UserName :user="authStore.user" /></div>
            <div class="text-subtitle1 text-secondary">{{ authStore.user?.email }}</div>
          </div>
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="q-mt-lg q-mb-xl">
        <h5 class="q-mt-none q-mb-md section-title text-primary">Preferences</h5>
        <q-separator class="q-mb-md separator" />

        <q-list>
          <q-item class="q-pa-sm card-bg q-mb-sm">
            <q-item-section avatar>
              <q-icon
                name="notifications"
                color="primary"
                size="md"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-primary">Notifications</q-item-label>
              <q-item-label
                caption
                class="text-caption"
              >
                Enable push notifications
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                v-model="notificationsEnabled"
                color="primary"
              />
            </q-item-section>
          </q-item>

          <q-item class="q-pa-sm card-bg">
            <q-item-section avatar>
              <q-icon
                :name="isDark ? 'dark_mode' : 'light_mode'"
                color="primary"
                size="md"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-primary">Dark Mode</q-item-label>
              <q-item-label
                caption
                class="text-caption"
              >
                Toggle between light and dark theme
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                :model-value="isDark"
                color="primary"
                @click="toggleDarkMode"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Account Information Section -->
      <div class="q-mb-xl">
        <h5 class="q-mt-none q-mb-md section-title text-primary">Account Information</h5>
        <q-separator class="q-mb-md separator" />

        <div class="row q-col-gutter-md q-col-gutter-y-xs">
          <div class="col-12 col-sm-6">
            <q-item class="q-pa-sm card-bg">
              <q-item-section avatar>
                <q-icon
                  name="email"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  caption
                  class="text-caption"
                >
                  Email
                </q-item-label>
                <q-item-label class="text-primary">{{ authStore.user?.email }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div
            class="col-12 col-sm-6"
            v-if="authStore.user?.user_metadata?.full_name"
          >
            <q-item class="q-pa-sm card-bg">
              <q-item-section avatar>
                <q-icon
                  name="person"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  caption
                  class="text-caption"
                >
                  Full Name
                </q-item-label>
                <q-item-label class="text-primary">{{
                  authStore.user?.user_metadata?.full_name
                }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div
            class="col-12 col-sm-6"
            v-if="authStore.user?.app_metadata?.provider"
          >
            <q-item class="q-pa-sm card-bg">
              <q-item-section avatar>
                <q-icon
                  name="login"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  caption
                  class="text-caption"
                >
                  Sign-in Provider
                </q-item-label>
                <q-item-label class="text-primary">{{
                  authStore.user?.app_metadata?.provider
                }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div
            class="col-12 col-sm-6"
            v-if="authStore.user?.created_at"
          >
            <q-item class="q-pa-sm card-bg">
              <q-item-section avatar>
                <q-icon
                  name="calendar_today"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  caption
                  class="text-caption"
                >
                  Joined On
                </q-item-label>
                <q-item-label class="text-primary">{{
                  formatDate(authStore.user?.created_at)
                }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div
            class="col-12"
            v-if="authStore.user?.id"
          >
            <q-item class="q-pa-sm card-bg">
              <q-item-section avatar>
                <q-icon
                  name="fingerprint"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  caption
                  class="text-caption"
                >
                  User ID
                </q-item-label>
                <q-item-label class="ellipsis text-primary">{{ authStore.user?.id }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </div>

      <!-- Sign Out Button -->
      <div class="q-mt-xl text-center">
        <q-btn
          color="negative"
          text-color="white"
          icon="logout"
          label="Sign Out"
          padding="sm lg"
          :loading="isSigningOut"
          @click="handleSignOut"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useTheme } from 'src/composables/useTheme'
import UserAvatar from 'src/components/UserAvatar.vue'
import UserName from 'src/components/UserName.vue'

const authStore = useAuthStore()
const router = useRouter()
const isSigningOut = ref(false)
const notificationsEnabled = ref(false)

// Theme toggle functionality
const { isDark, toggleDarkMode } = useTheme()

// Format dates for better readability
function formatDate(dateString?: string): string {
  if (!dateString) return 'Not available'

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// Handle sign out
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
