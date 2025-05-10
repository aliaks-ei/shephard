<template>
  <div class="auth-callback-page flex flex-center q-pa-md">
    <q-card class="auth-card shadow-5">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h4">Welcome to Shephard</div>
      </q-card-section>

      <q-card-section class="q-pa-lg flex flex-center column">
        <div v-if="isLoading" class="q-mb-md">
          <q-spinner color="primary" size="3em" />
          <div class="text-subtitle1 q-mt-md">Verifying your login...</div>
        </div>
        <div v-else-if="error" class="text-negative">
          <q-icon name="error" size="3em" />
          <div class="text-subtitle1 q-mt-md">{{ error }}</div>
          <q-btn color="primary" label="Back to Login" to="/auth" class="q-mt-md" />
        </div>
        <div v-else class="text-positive">
          <q-icon name="check_circle" size="3em" />
          <div class="text-subtitle1 q-mt-md">Successfully authenticated!</div>
          <div class="text-subtitle2 q-mb-md">Redirecting you...</div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth';
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // The hash fragment contains the auth info from Supabase
    // Supabase client will automatically handle this
    await authStore.init();

    // After a brief delay to show success message, redirect to home
    setTimeout(() => {
      redirectToHomePage();
    }, 1500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Authentication failed';
    console.error('Error during authentication callback:', err);
  } finally {
    isLoading.value = false;
  }
});

async function redirectToHomePage(): Promise<void> {
  const redirectPath = route.query.redirectTo?.toString() || '/';
  await router.push(redirectPath);
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
