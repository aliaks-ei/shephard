import { useRouter, useRoute } from 'vue-router'

import { useAuthStore } from 'src/stores/auth'
import { getCsrfToken, clearCsrfToken, generateCsrfToken } from 'src/utils/csrf'
import { useNonce } from 'src/composables/useNonce'
import { useError } from 'src/composables/useError'
import type { GoogleSignInResponse } from 'src/types'

export function useGoogleAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const { handleError } = useError()

  const { isNonceReady, hashedNonce, generateNonce, resetNonce, ensureFreshNonce } = useNonce()

  async function initGoogleAuth() {
    const nonce = await ensureFreshNonce()
    if (!nonce) return

    generateCsrfToken()

    window.vueGoogleCallback = (response) => {
      handleGoogleSignIn(response)
    }
  }

  async function handleGoogleSignIn(response: GoogleSignInResponse) {
    try {
      const csrfToken = getCsrfToken()
      if (!csrfToken) {
        throw new Error('CSRF token is missing')
      }

      const authRequest = {
        ...response,
        csrfToken,
      }

      const data = await authStore.signInWithGoogle(authRequest)

      if (!data) return

      resetNonce()
      clearCsrfToken()

      const redirectPath = route.query.redirect?.toString() || '/'
      await router.push(redirectPath)
    } catch (err) {
      handleError('AUTH.GOOGLE_SIGNIN_FAILED', err, { component: 'GoogleAuth' })
    }
  }

  function cleanup() {
    if (window.vueGoogleCallback) {
      delete window.vueGoogleCallback
    }

    resetNonce()
    clearCsrfToken()
  }

  return {
    hashedNonce,
    isNonceReady,
    generateNonce,
    initGoogleAuth,
    handleGoogleSignIn,
    cleanup,
  }
}
