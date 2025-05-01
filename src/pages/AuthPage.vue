<template>
  <div class="auth-page flex flex-center q-pa-md">
    <q-card class="auth-card shadow-5">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h4">Welcome to Shephard</div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="text-subtitle1 text-center q-mb-md">Please sign in to continue</div>

        <div v-if="hashedNonce" class="flex flex-center">
          <component :is="'script'" src="https://accounts.google.com/gsi/client" async />
          <div
            id="g_id_onload"
            data-client_id="714982504675-o57hsgsh6nfg1qj7snd6k1hmccmpk3sv.apps.googleusercontent.com"
            data-context="signin"
            data-ux_mode="popup"
            data-callback="handleGoogleSignIn"
            data-auto_prompt="false"
            :data-nonce="hashedNonce"
          ></div>

          <div
            class="g_id_signin"
            data-type="standard"
            data-shape="pill"
            data-theme="outline"
            data-text="signin_with"
            data-size="large"
            data-logo_alignment="left"
          ></div>
        </div>

        <div v-else class="flex flex-center">
          <q-spinner color="primary" size="2em" />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { GoogleSignInResponse } from 'src/boot/google-auth';

// Import boot file for global handlers
import 'src/boot/google-auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const hashedNonce = ref('');

onMounted(async () => {
  // Generate new nonce for this authentication session
  const nonceData = await authStore.generateNonce();
  hashedNonce.value = nonceData.hashedNonce;

  // Set up the callback function that will be called by the global handleGoogleSignIn
  window.vueGoogleCallback = (response: GoogleSignInResponse) => {
    handleGoogleSignIn(response).catch((err) => {
      console.error('Error during authentication:', err);
    });
  };
});

// Handle Google Sign-In response and redirect on success
async function handleGoogleSignIn(response: GoogleSignInResponse) {
  try {
    const result = await authStore.signInWithGoogle(response);

    if (result.error) {
      console.error('Authentication failed:', result.error);
    } else if (result.data) {
      // Redirect after successful sign-in
      const redirectPath = route.query.redirect?.toString() || '/';
      await router.push(redirectPath);
    }
  } catch (err) {
    console.error('Error during authentication:', err);
  }
}

onUnmounted(() => {
  if (window.vueGoogleCallback) {
    delete window.vueGoogleCallback;
  }
});
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
}

.auth-card {
  max-width: 480px;
  width: 100%;
}
</style>
