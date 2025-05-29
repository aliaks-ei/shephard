<template>
  <div class="auth-page flex flex-center column q-pa-md">
    <h1 class="text-h4 text-primary q-mb-xl">Welcome to Shephard</h1>
    <q-card class="auth-card shadow-5">
      <q-card-section class="bg-primary text-white text-center">
        <h2 class="text-h5">Sign In</h2>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <p class="text-subtitle1 text-center q-mb-md">Please sign in to continue</p>

        <!-- Email OTP Authentication -->
        <EmailOtpForm />

        <q-separator class="q-my-md" />
        <p class="text-center q-mb-md">OR</p>

        <!-- Google Authentication -->
        <GoogleAuthButton />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import GoogleAuthButton from 'src/components/GoogleAuthButton.vue'
import EmailOtpForm from 'src/components/EmailOtpForm.vue'
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
