export interface GoogleSignInResponse {
  credential: string
  select_by: string
  [key: string]: string
}

declare global {
  interface Window {
    handleGoogleSignIn: (response: GoogleSignInResponse) => void
    vueGoogleCallback?: (response: GoogleSignInResponse) => void
  }
}
