import { defineBoot } from '#q-app/wrappers';

/**
 * Interface for Google Sign-In response object
 */
export interface GoogleSignInResponse {
  credential: string;
  select_by: string;
  [key: string]: string;
}

/**
 * Interface for nonce generation result
 */
export interface NonceResult {
  nonce: string;
  hashedNonce: string;
}

// Define global window properties
declare global {
  interface Window {
    handleGoogleSignIn: (response: GoogleSignInResponse) => void;
    vueGoogleCallback?: (response: GoogleSignInResponse) => void;
  }
}

// This function will be called early in the boot process, before your Vue app is mounted
export default defineBoot(() => {
  // Define the global callback that Google Sign-In will use
  window.handleGoogleSignIn = (response: GoogleSignInResponse) => {
    // Forward to the Vue component's handler if it exists
    if (window.vueGoogleCallback) {
      window.vueGoogleCallback(response);
    } else {
      console.warn('Google Sign-In callback received but no Vue handler is registered');
    }
  };
});
