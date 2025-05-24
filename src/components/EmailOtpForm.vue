<template>
  <div class="email-otp-form">
    <q-form
      @submit.prevent="handleEmailSubmit"
      class="q-gutter-md q-mb-md"
      novalidate
    >
      <q-input
        v-model="email"
        label="Email"
        type="email"
        :disable="authStore.isEmailSent"
        outlined
        :rules="emailRules()"
        lazy-rules="ondemand"
      />

      <div
        class="text-negative q-mb-sm"
        v-if="authStore.emailError"
      >
        {{ authStore.emailError }}
      </div>

      <div
        v-if="authStore.isEmailSent"
        class="text-positive q-mb-md"
      >
        We've sent a magic link to your email. Please check your inbox and click the link to sign
        in.
      </div>

      <q-btn
        type="submit"
        :label="authStore.isEmailSent ? 'Resend Email' : 'Sign in with Email'"
        color="primary"
        class="full-width"
        :loading="isLoading"
      />
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth'
import { ref, onMounted } from 'vue'
import { emailRules } from 'src/utils/validation-rules'

const authStore = useAuthStore()
const email = ref('')
const isLoading = ref(false)

onMounted(() => {
  authStore.resetEmailState()
})

async function handleEmailSubmit() {
  if (!email.value) return

  isLoading.value = true
  try {
    const result = await authStore.signInWithOtp(email.value)

    if (result.error) {
      console.error('Email authentication failed:', result.error)
    }
  } catch (err) {
    console.error('Error during email authentication:', err)
  } finally {
    isLoading.value = false
  }
}
</script>
