import { onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import { getCsrfToken, clearCsrfToken, generateCsrfToken } from 'src/utils/csrf'
import { useNonce } from 'src/composables/useNonce'
import type { GoogleSignInResponse } from 'src/boot/google-auth'

declare global {
  interface Window {
    vueGoogleCallback?: (response: GoogleSignInResponse) => void
  }
}

export function useGoogleAuth() {
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  const {
    isNonceReady,
    hashedNonce,
    generateNonce,
    resetNonce,
    ensureFreshNonce,
    getCurrentNonce,
  } = useNonce()

  async function initGoogleAuth() {
    const nonce = await ensureFreshNonce()

    if (!nonce) {
      return false
    }

    generateCsrfToken()

    window.vueGoogleCallback = (response: GoogleSignInResponse) => {
      handleGoogleSignIn(response)
    }

    return true
  }

  async function handleGoogleSignIn(response: GoogleSignInResponse) {
    try {
      // Double-check we have a valid nonce
      if (!isNonceReady.value) {
        return { error: new Error('No valid nonce available') }
      }

      // Verify nonce exists
      const currentNonce = getCurrentNonce()
      if (!currentNonce) {
        return { error: new Error('Nonce data is missing') }
      }

      const csrfToken = getCsrfToken()
      if (!csrfToken) {
        return { error: new Error('CSRF token is missing') }
      }

      const authRequest = {
        ...response,
        csrfToken,
      }

      const data = await userStore.auth.signInWithGoogle(authRequest)

      if (data) {
        resetNonce()
        clearCsrfToken()

        const redirectPath = route.query.redirect?.toString() || '/'
        await router.push(redirectPath)
      }

      return { data, error: null }
    } catch (err) {
      return { error: err }
    }
  }

  function cleanup() {
    if (window.vueGoogleCallback) {
      delete window.vueGoogleCallback
    }

    resetNonce()
    clearCsrfToken()
  }

  function setupAutoCleanup() {
    onBeforeUnmount(cleanup)
  }

  return {
    hashedNonce,
    isNonceReady,
    generateNonce,
    resetNonce,
    initGoogleAuth,
    handleGoogleSignIn,
    cleanup,
    setupAutoCleanup,
  }
}
