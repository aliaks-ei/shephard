import { defineBoot } from '#q-app/wrappers';

export interface GoogleSignInResponse {
  credential: string;
  select_by: string;
  [key: string]: string;
}

export interface NonceResult {
  nonce: string;
  hashedNonce: string;
}

declare global {
  interface Window {
    handleGoogleSignIn: (response: GoogleSignInResponse) => void;
    vueGoogleCallback?: (response: GoogleSignInResponse) => void;
  }
}

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
