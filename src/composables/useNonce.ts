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
  /**
   * Generates a new secure nonce for authentication
   * @returns {Promise<NonceData>} A timestamped nonce data object
   */
  async function generateNonce(): Promise<NonceData> {
    const nonceData = await generateSecureNonce()
    const timestampedNonce = createTimestampedNonce(nonceData)

    currentNonce.value = timestampedNonce
    return timestampedNonce
  }

  /**
   * Resets the current nonce
   */
  function resetNonce(): void {
    currentNonce.value = null
  }

  /**
   * Ensures a fresh valid nonce is available
   * Generates a new one if none exists or if the current one has expired
   * @returns {Promise<NonceData | null>} The current valid nonce or null if generation failed
   */
  async function ensureFreshNonce(): Promise<NonceData | null> {
    if (!currentNonce.value) {
      return generateNonce()
    }

    // Check if nonce has expired
    if (!isNonceValid(currentNonce.value.createdAt)) {
      return generateNonce()
    }

    return currentNonce.value
  }

  /**
   * Gets the current nonce data
   * @returns {NonceData | null} The current nonce or null if none exists
   */
  function getCurrentNonce(): NonceData | null {
    return currentNonce.value
  }

  return {
    currentNonce: readonly(currentNonce),
    hashedNonce: readonly(hashedNonce),
    isNonceReady: readonly(isNonceReady),
    generateNonce,
    resetNonce,
    ensureFreshNonce,
    getCurrentNonce,
  }
}
