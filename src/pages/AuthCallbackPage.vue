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

const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  await redirectToHomePage()

  isLoading.value = false
})

async function redirectToHomePage(): Promise<void> {
  const redirectPath = route.query.redirectTo?.toString() || '/'
  await router.push(redirectPath)
}
</script>
