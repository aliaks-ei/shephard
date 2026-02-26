import { useRouter, useRoute } from 'vue-router'

import { useAuthStore } from 'src/stores/auth'
import { useNonce } from 'src/composables/useNonce'
import { useError } from 'src/composables/useError'
import { sanitizeRedirectPath } from 'src/utils/navigation'
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

    window.vueGoogleCallback = (response) => {
      handleGoogleSignIn(response)
    }
  }

  async function handleGoogleSignIn(response: GoogleSignInResponse) {
    try {
      const data = await authStore.signInWithGoogle(response)

      if (!data) return

      resetNonce()

      const redirectPath = sanitizeRedirectPath(route.query.redirectTo)
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
