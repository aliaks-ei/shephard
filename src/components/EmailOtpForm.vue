<template>
  <q-form
    novalidate
    @submit.prevent="handleEmailSubmit"
  >
    <!-- Error Alert -->
    <q-banner
      v-if="userStore.auth.emailError"
      class="bg-red-1 text-red-9 q-mb-md"
      rounded
      dense
    >
      <template #avatar>
        <q-icon
          name="eva-alert-circle-outline"
          color="negative"
        />
      </template>
      {{ userStore.auth.emailError }}
    </q-banner>

    <!-- Success Alert -->
    <q-banner
      v-if="userStore.auth.isEmailSent"
      class="bg-green-1 text-green-9 q-mb-md"
      rounded
      dense
    >
      <template #avatar>
        <q-icon
          name="eva-checkmark-circle-2-outline"
          color="positive"
        />
      </template>
      We've sent a magic link to your email. Please check your inbox and click the link to sign in.
    </q-banner>

    <div class="q-mb-md">
      <label
        for="email-input"
        class="text-body2 text-weight-medium q-mb-xs block"
      >
        Email
      </label>
      <q-input
        id="email-input"
        v-model="email"
        placeholder="you@example.com"
        type="email"
        :disable="userStore.auth.isEmailSent"
        outlined
        dense
        no-error-icon
        inputmode="email"
        :rules="emailRules()"
        lazy-rules="ondemand"
        hide-bottom-space
      />
    </div>

    <q-btn
      type="submit"
      :label="submitBtnLabel"
      color="primary"
      class="full-width"
      :loading="isLoading"
      no-caps
      unelevated
    />
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from 'src/stores/user'
import { emailRules } from 'src/utils/validation-rules'

const userStore = useUserStore()
const email = ref('')
const isLoading = ref(false)

const submitBtnLabel = computed(() =>
  userStore.auth.isEmailSent ? 'Resend Email' : 'Sign in with Email',
)

async function handleEmailSubmit() {
  if (!email.value) return

  isLoading.value = true

  await userStore.auth.signInWithOtp(email.value)

  isLoading.value = false
}

onMounted(() => {
  userStore.auth.resetEmailState()
})
</script>
