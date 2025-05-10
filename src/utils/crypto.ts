import type { NonceResult } from 'src/boot/google-auth';

/**
 * Generates a secure nonce and its hashed version for Google authentication
 * The nonce is used with Supabase auth, while the hashed nonce is sent to Google
 */
export async function generateSecureNonce(): Promise<NonceResult> {
  // Generate random bytes and convert to base64 string
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));

  // Encode the nonce for hashing
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);

  // Hash the nonce using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);

  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return { nonce, hashedNonce };
}
