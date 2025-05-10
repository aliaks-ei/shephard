import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { supabase } from 'src/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { generateSecureNonce } from 'src/utils/crypto';
import type { NonceResult, GoogleSignInResponse } from 'src/boot/google-auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const isLoading = ref(true);
  const currentNonce = ref<NonceResult | null>(null);
  const isEmailSent = ref(false);
  const emailError = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  // Initialize auth state
  async function init() {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      session.value = currentSession;
      user.value = currentSession?.user ?? null;
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      isLoading.value = false;
    }
  }

  // Generate a new nonce for Google authentication
  async function generateNonce(): Promise<NonceResult> {
    const nonceData = await generateSecureNonce();
    currentNonce.value = nonceData;
    return nonceData;
  }

  async function signInWithGoogle(response: GoogleSignInResponse) {
    if (!currentNonce.value) {
      console.error('No nonce available for authentication');
      return { data: null, error: new Error('No nonce available for authentication') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential || '',
        nonce: currentNonce.value.nonce,
      });

      if (error) throw error;

      // Clear the nonce after use
      currentNonce.value = null;

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { data: null, error };
    }
  }

  // Send OTP to email
  async function signInWithOtp(email: string) {
    try {
      isEmailSent.value = false;
      emailError.value = null;

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      isEmailSent.value = true;
      return { data, error: null };
    } catch (error) {
      emailError.value = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error sending OTP to email:', error);
      return { data: null, error };
    }
  }

  // Verify OTP sent to email
  async function verifyOtp(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'magiclink',
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { data: null, error };
    }
  }

  // Sign out
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      session.value = null;
      user.value = null;

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Update profile
  async function updateProfile(updates: { email?: string; data?: object }) {
    try {
      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      user.value = data.user;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Reset email state
  function resetEmailState() {
    isEmailSent.value = false;
    emailError.value = null;
  }

  // Subscribe to auth state changes
  supabase.auth.onAuthStateChange((_event, currentSession) => {
    session.value = currentSession;
    user.value = currentSession?.user ?? null;
  });

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    currentNonce,
    isEmailSent,
    emailError,

    init,
    signOut,
    updateProfile,
    signInWithGoogle,
    signInWithOtp,
    verifyOtp,
    generateNonce,
    resetEmailState,
  };
});
