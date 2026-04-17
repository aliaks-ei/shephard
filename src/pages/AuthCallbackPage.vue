<template>
  <AuthLoginCard class="relative-position">
    <q-inner-loading
      :showing="isLoading"
      label="Verifying your login..."
      label-class="text-body2 text-grey-7"
    />

    <div
      v-if="!isLoading && error"
      class="text-center q-py-md"
    >
      <q-icon
        name="eva-alert-triangle-outline"
        size="3em"
        color="negative"
      />
      <p class="text-subtitle1 q-mt-md text-negative">{{ error }}</p>
      <q-btn
        color="primary"
        label="Back to Login"
        to="/auth"
        class="q-mt-md"
        no-caps
        unelevated
        dense
      />
    </div>

    <div
      v-else-if="!isLoading"
      class="text-center q-py-md"
    >
      <q-icon
        name="eva-checkmark-circle-outline"
        size="3em"
        color="positive"
      />
      <p class="text-subtitle1 q-mt-md text-positive">Successfully authenticated!</p>
      <p class="text-body2 text-grey-7">Redirecting you...</p>
    </div>
  </AuthLoginCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import AuthLoginCard from 'src/components/auth/AuthLoginCard.vue'
import { supabase } from 'src/lib/supabase/client'
import { sanitizeRedirectPath } from 'src/utils/navigation'

const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const providerError = readProviderError()
  if (providerError) {
    error.value = providerError
    isLoading.value = false
    return
  }

  // With PKCE, supabase-js auto-exchanges `?code=...` on init (detectSessionInUrl).
  // We still assert the session actually landed before redirecting so a silent
  // exchange failure surfaces to the user instead of looping them back in.
  const { data, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !data.session) {
    error.value = 'We could not verify your sign-in. Please try again.'
    isLoading.value = false
    return
  }

  await redirectToHomePage()
  isLoading.value = false
})

function readProviderError(): string | null {
  const queryError = route.query.error_description ?? route.query.error
  if (typeof queryError === 'string' && queryError.trim()) {
    return queryError
  }
  return null
}

async function redirectToHomePage(): Promise<void> {
  const redirectPath = sanitizeRedirectPath(route.query.redirectTo)
  await router.push(redirectPath)
}
</script>
