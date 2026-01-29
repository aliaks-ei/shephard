<template>
  <div class="flex flex-center">
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

    <div
      v-else
      class="column items-center q-gutter-y-sm q-pa-md"
    >
      <q-spinner
        color="primary"
        size="1.5em"
      />
      <span class="text-body2 text-grey-7">Preparing secure authentication...</span>
      <q-btn
        flat
        dense
        color="primary"
        label="Refresh"
        icon="eva-refresh-outline"
        no-caps
        @click="refreshGoogleAuth"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { useGoogleAuth } from 'src/composables/useGoogleAuth'
import 'src/boot/auth'

const googleClientId = ref<string>(import.meta.env.VITE_GOOGLE_CLIENT_ID)
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
