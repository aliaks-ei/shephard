<template>
  <div class="auth-page flex flex-center column q-pa-md">
    <h1 class="text-h4 text-primary q-mb-xl">Welcome to Shephard</h1>
    <q-card class="auth-card shadow-5">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h5">Sign In</div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="text-subtitle1 text-center q-mb-md">Please sign in to continue</div>

        <!-- Email OTP Authentication -->
        <q-form @submit.prevent="handleEmailSubmit" class="q-gutter-md q-mb-md" novalidate>
          <q-input
            v-model="email"
            label="Email"
            type="email"
            :disable="authStore.isEmailSent"
            outlined
            :rules="emailRules()"
            lazy-rules="ondemand"
          />

          <div class="text-negative q-mb-sm" v-if="authStore.emailError">
            {{ authStore.emailError }}
          </div>

          <div v-if="authStore.isEmailSent" class="text-positive q-mb-md">
            We've sent a magic link to your email. Please check your inbox and click the link to
            sign in.
          </div>

          <q-btn
            type="submit"
            :label="authStore.isEmailSent ? 'Resend Email' : 'Sign in with Email'"
            color="primary"
            class="full-width"
            :loading="isEmailLoading"
          />
        </q-form>

        <q-separator class="q-my-md" />
        <div class="text-center q-mb-md">OR</div>

        <!-- Google Authentication -->
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

import { emailRules } from 'src/utils/validation-rules';
import type { GoogleSignInResponse } from 'src/boot/google-auth';

import 'src/boot/google-auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const hashedNonce = ref('');
const email = ref('');
const isEmailLoading = ref(false);

onMounted(async () => {
  // Generate new nonce for this authentication session
  const nonceData = await authStore.generateNonce();
  hashedNonce.value = nonceData.hashedNonce;

  // Reset email state when component is mounted
  authStore.resetEmailState();

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

// Handle Email OTP authentication
async function handleEmailSubmit() {
  if (!email.value) return;

  isEmailLoading.value = true;
  try {
    const result = await authStore.signInWithOtp(email.value);

    if (result.error) {
      console.error('Email authentication failed:', result.error);
    }
  } catch (err) {
    console.error('Error during email authentication:', err);
  } finally {
    isEmailLoading.value = false;
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
  max-width: 380px;
  width: 100%;
}
</style>
