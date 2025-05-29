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
        :disable="userStore.isEmailSent"
        outlined
        :rules="emailRules()"
        lazy-rules="ondemand"
      />

      <p
        v-if="userStore.emailError"
        class="text-negative q-mb-sm"
      >
        {{ userStore.emailError }}
      </p>

      <p
        v-if="userStore.isEmailSent"
        class="text-positive q-mb-md"
      >
        We've sent a magic link to your email. Please check your inbox and click the link to signin.
      </p>

      <q-btn
        type="submit"
        :label="submitBtnLabel"
        color="primary"
        class="full-width"
        :loading="isLoading"
      />
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from 'src/stores/user'
import { emailRules } from 'src/utils/validation-rules'

const userStore = useUserStore()
const email = ref('')
const isLoading = ref(false)

const submitBtnLabel = computed(() =>
  userStore.isEmailSent ? 'Resend Email' : 'Sign in with Email',
)

async function handleEmailSubmit() {
  if (!email.value) return

  isLoading.value = true

  await userStore.signInWithOtp(email.value)

  isLoading.value = false
}

onMounted(() => {
  userStore.resetEmailState()
})
</script>
