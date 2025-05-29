<template>
  <div class="google-auth-container flex flex-center flex-column">
    <div v-if="isNonceReady">
      <component
        :is="'script'"
        src="https://accounts.google.com/gsi/client"
        async
      />
      <div
        id="g_id_onload"
        :data-client_id="googleClientId"
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

    <div v-else>
      <q-spinner
        color="primary"
        size="2em"
        class="q-mb-sm"
      />
      <p class="text-body2 q-mb-sm">Preparing secure authentication...</p>
      <q-btn
        flat
        dense
        color="primary"
        label="Refresh"
        icon="refresh"
        @click="refreshGoogleAuth"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useGoogleAuth } from 'src/composables/useGoogleAuth'
import 'src/boot/auth'

const googleClientId = ref(import.meta.env.VITE_GOOGLE_CLIENT_ID)
const { hashedNonce, isNonceReady, initGoogleAuth, cleanup, generateNonce } = useGoogleAuth()

async function refreshGoogleAuth() {
  await generateNonce()
  await initGoogleAuth()
}

onMounted(() => {
  refreshGoogleAuth()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.google-auth-container {
  width: 100%;
}
</style>
