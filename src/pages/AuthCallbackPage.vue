<template>
  <div class="auth-callback-page q-pa-md">
    <div class="row justify-center items-center full-height">
      <div class="col-12 col-sm-8 col-md-6 col-lg-4 col-xl-3">
        <q-card class="shadow-5 full-width">
          <q-card-section class="bg-primary text-white text-center">
            <h1 class="text-h4">Welcome to Shephard</h1>
          </q-card-section>

          <q-card-section class="q-pa-lg flex flex-center column">
            <div
              v-if="isLoading"
              class="q-mb-md"
            >
              <q-spinner
                color="primary"
                size="3em"
              />
              <p class="text-subtitle1 q-mt-md">Verifying your login...</p>
            </div>
            <div
              v-else-if="error"
              class="text-negative"
            >
              <q-icon
                name="eva-alert-triangle-outline"
                size="3em"
              />
              <p class="text-subtitle1 q-mt-md">{{ error }}</p>
              <q-btn
                color="primary"
                label="Back to Login"
                to="/auth"
                class="q-mt-md"
              />
            </div>
            <div
              v-else
              class="text-positive"
            >
              <q-icon
                name="eva-checkmark-circle-outline"
                size="3em"
              />
              <p class="text-subtitle1 q-mt-md">Successfully authenticated!</p>
              <p class="text-subtitle2 q-mb-md">Redirecting you...</p>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from 'src/stores/user'
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  await userStore.initUser()

  setTimeout(() => {
    redirectToHomePage()
  }, 1500)

  isLoading.value = false
})

async function redirectToHomePage(): Promise<void> {
  const redirectPath = route.query.redirectTo?.toString() || '/'
  await router.push(redirectPath)
}
</script>

<style scoped>
.auth-callback-page {
  min-height: 100vh;
}

.auth-card {
  max-width: 480px;
  width: 100%;
}
</style>
