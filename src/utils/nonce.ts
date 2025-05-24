import type { NonceResult } from 'src/boot/google-auth'

export interface NonceData extends NonceResult {
  createdAt: number
}

/**
 * Maximum age of a nonce in milliseconds (5 minutes)
 * After this time, the nonce is considered expired and will be regenerated
 */
export const NONCE_MAX_AGE_MS = 5 * 60 * 1000

/**
 * Generates a secure nonce and its hashed version for Google authentication
 * The nonce is used with Supabase auth, while the hashed nonce is sent to Google
 * @returns {NonceResult} An object containing the nonce and its hashed version
 */
export async function generateSecureNonce(): Promise<NonceResult> {
  // Generate random bytes and convert to base64 string
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))

  // Encode the nonce for hashing
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)

  // Hash the nonce using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)

  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return { nonce, hashedNonce }
}

/**
 * Creates a timestamped nonce data object to track nonce age
 * @param nonceData The nonce data (nonce and hashedNonce)
 * @returns NonceData with timestamp
 */
export function createTimestampedNonce(nonceData: NonceResult): NonceData {
  return {
    ...nonceData,
    createdAt: Date.now(),
  }
}

/**
 * Checks if a nonce has expired based on its creation timestamp
 * @param createdAt The timestamp when the nonce was created
 * @returns boolean indicating if the nonce is still valid
 */
export function isNonceValid(createdAt: number): boolean {
  const now = Date.now()
  const age = now - createdAt
  return age < NONCE_MAX_AGE_MS
}
