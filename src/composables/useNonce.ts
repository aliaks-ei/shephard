import { ref, computed, readonly } from 'vue'
import {
  generateSecureNonce,
  createTimestampedNonce,
  isNonceValid,
  type NonceData,
} from 'src/utils/nonce'

const currentNonce = ref<NonceData | null>(null)

const hashedNonce = computed(() => currentNonce.value?.hashedNonce || '')
const isNonceReady = computed(() => {
  if (!currentNonce.value?.hashedNonce) return false

  return currentNonce.value.createdAt && isNonceValid(currentNonce.value.createdAt)
})

export function useNonce() {
  async function generateNonce(): Promise<NonceData> {
    const nonceData = await generateSecureNonce()
    const timestampedNonce = createTimestampedNonce(nonceData)

    currentNonce.value = timestampedNonce
    return timestampedNonce
  }

  function resetNonce(): void {
    currentNonce.value = null
  }

  async function ensureFreshNonce(): Promise<NonceData | null> {
    if (!currentNonce.value) {
      return generateNonce()
    }

    if (!isNonceValid(currentNonce.value.createdAt)) {
      return generateNonce()
    }

    return currentNonce.value
  }

  return {
    currentNonce: readonly(currentNonce),
    hashedNonce: readonly(hashedNonce),
    isNonceReady: readonly(isNonceReady),
    generateNonce,
    resetNonce,
    ensureFreshNonce,
  }
}
