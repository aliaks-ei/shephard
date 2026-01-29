<template>
  <q-form
    novalidate
    @submit.prevent="handleSubmit"
  >
    <!-- Error Banners -->
    <q-banner
      v-if="emailError"
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
      {{ emailError }}
    </q-banner>

    <q-banner
      v-if="otpError"
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
      {{ otpError }}
    </q-banner>

    <!-- Step 1: Email Entry -->
    <template v-if="currentStep === 'email'">
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
        label="Continue with Email"
        color="primary"
        class="full-width"
        :loading="isSendingEmail"
        no-caps
        unelevated
      />
    </template>

    <!-- Step 2: OTP Verification -->
    <template v-else>
      <q-banner
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
        <span>
          We've sent a 6-digit code to
          <strong>{{ email }}</strong>
        </span>
      </q-banner>

      <div class="q-mb-md">
        <label
          for="otp-input"
          class="text-body2 text-weight-medium q-mb-xs block"
        >
          Verification Code
        </label>
        <q-input
          id="otp-input"
          ref="otpInputRef"
          v-model="otpCode"
          placeholder="000000"
          maxlength="6"
          inputmode="numeric"
          outlined
          dense
          no-error-icon
          hide-bottom-space
          :rules="otpRules"
          lazy-rules="ondemand"
        />
      </div>

      <q-btn
        type="submit"
        label="Verify Code"
        color="primary"
        class="full-width"
        :loading="isVerifying"
        no-caps
        unelevated
      />

      <div class="row items-center justify-between q-mt-md">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :label="resendLabel"
          :disable="resendCountdown > 0 || isResending"
          :loading="isResending"
          @click="handleResendCode"
        />
        <q-btn
          flat
          dense
          no-caps
          color="grey-7"
          label="Use a different email"
          @click="goBackToEmail"
        />
      </div>
    </template>
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { QInput } from 'quasar'

import { useUserStore } from 'src/stores/user'
import { emailRules } from 'src/utils/validation-rules'

const RESEND_COOLDOWN_SECONDS = 60

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Form state
const email = ref('')
const otpCode = ref('')
const otpInputRef = ref<QInput | null>(null)

// Step management
const currentStep = ref<'email' | 'otp'>('email')

// Loading states
const isSendingEmail = ref(false)
const isVerifying = ref(false)
const isResending = ref(false)

// Error states
const emailError = ref<string | null>(null)
const otpError = ref<string | null>(null)

// Resend countdown
const resendCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const resendLabel = computed(() =>
  resendCountdown.value > 0 ? `Resend code in ${resendCountdown.value}s` : 'Resend code',
)

const otpRules = [(v: string) => !!v || 'Please enter the verification code']

function startCountdown() {
  resendCountdown.value = RESEND_COOLDOWN_SECONDS

  countdownInterval = setInterval(() => {
    resendCountdown.value--

    if (resendCountdown.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

function handleSubmit() {
  if (currentStep.value === 'email') {
    handleEmailSubmit()
  } else {
    handleOtpVerify()
  }
}

async function handleEmailSubmit() {
  if (!email.value) return

  isSendingEmail.value = true
  emailError.value = null

  try {
    await userStore.auth.signInWithOtp(email.value)

    if (userStore.auth.emailError) {
      emailError.value = userStore.auth.emailError
    } else {
      currentStep.value = 'otp'
      startCountdown()

      await nextTick()
      otpInputRef.value?.focus()
    }
  } finally {
    isSendingEmail.value = false
  }
}

async function handleOtpVerify() {
  if (!otpCode.value || otpCode.value.length !== 6) return

  isVerifying.value = true
  otpError.value = null

  try {
    const result = await userStore.auth.verifyOtp(email.value, otpCode.value)

    if (result) {
      const redirectPath = route.query.redirectTo?.toString() || '/'
      await router.push(redirectPath)
    } else {
      otpError.value = 'Invalid or expired code. Please try again.'
      otpCode.value = ''

      await nextTick()
      otpInputRef.value?.focus()
    }
  } finally {
    isVerifying.value = false
  }
}

async function handleResendCode() {
  isResending.value = true
  emailError.value = null
  otpError.value = null

  try {
    await userStore.auth.signInWithOtp(email.value)

    if (userStore.auth.emailError) {
      otpError.value = userStore.auth.emailError
    } else {
      startCountdown()
    }
  } finally {
    isResending.value = false
  }
}

function goBackToEmail() {
  currentStep.value = 'email'
  otpCode.value = ''
  otpError.value = null
  stopCountdown()
  userStore.auth.resetEmailState()
}

onMounted(() => {
  userStore.auth.resetEmailState()
})

onUnmounted(() => {
  stopCountdown()
})
</script>
