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
      console.error('Failed to generate nonce for Google authentication')
      return false
    }

    generateCsrfToken()

    window.vueGoogleCallback = (response: GoogleSignInResponse) => {
      handleGoogleSignIn(response).catch((err) => {
        console.error('Error during authentication:', err)
      })
    }

    return true
  }

  async function handleGoogleSignIn(response: GoogleSignInResponse) {
    try {
      // Double-check we have a valid nonce
      if (!isNonceReady.value) {
        console.error('Authentication failed: No valid nonce available')
        return { error: 'No valid nonce available' }
      }

      // Verify nonce exists
      const currentNonce = getCurrentNonce()
      if (!currentNonce) {
        console.error('Authentication failed: Nonce data is missing')
        return { error: 'Nonce data is missing' }
      }

      const csrfToken = getCsrfToken()
      if (!csrfToken) {
        console.error('Authentication failed: CSRF token is missing')
        return { error: 'CSRF token is missing' }
      }

      const authRequest = {
        ...response,
        csrfToken,
      }

      const result = await userStore.signInWithGoogle(authRequest)

      if (result.error) {
        console.error('Authentication failed:', result.error)
        return result
      } else if (result.data) {
        resetNonce()
        clearCsrfToken()

        const redirectPath = route.query.redirect?.toString() || '/'
        await router.push(redirectPath)
        return result
      }

      return result
    } catch (err) {
      console.error('Error during authentication:', err)
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
