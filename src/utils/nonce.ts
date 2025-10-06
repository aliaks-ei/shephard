export interface NonceResult {
  nonce: string
  hashedNonce: string
}

export interface NonceData extends NonceResult {
  createdAt: number
}

export const NONCE_MAX_AGE_MS = 5 * 60 * 1000

export async function generateSecureNonce(): Promise<NonceResult> {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))

  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)

  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return { nonce, hashedNonce }
}

export function createTimestampedNonce(nonceData: NonceResult): NonceData {
  return {
    ...nonceData,
    createdAt: Date.now(),
  }
}

export function isNonceValid(createdAt: number): boolean {
  const now = Date.now()
  const age = now - createdAt
  return age < NONCE_MAX_AGE_MS
}
