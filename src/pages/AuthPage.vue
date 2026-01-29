<template>
  <AuthLoginCard>
    <!-- Email OTP Authentication -->
    <EmailOtpForm />

    <!-- Divider with OR -->
    <div class="row items-center q-my-lg">
      <q-separator class="col" />
      <span class="q-px-md text-caption text-uppercase text-grey-6">or continue with</span>
      <q-separator class="col" />
    </div>

    <!-- Google Authentication -->
    <GoogleAuthButton />
  </AuthLoginCard>
</template>

<script setup lang="ts">
import AuthLoginCard from 'src/components/auth/AuthLoginCard.vue'
import GoogleAuthButton from 'src/components/GoogleAuthButton.vue'
import EmailOtpForm from 'src/components/EmailOtpForm.vue'
</script>
