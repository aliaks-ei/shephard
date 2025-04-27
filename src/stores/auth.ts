import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { supabase } from 'src/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const isLoading = ref(true);

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

  // Sign in with email and password
  async function signInWithOtp(email: string) {
    try {
      isLoading.value = true;

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with OTP:', error);
    } finally {
      isLoading.value = false;
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

    init,
    signInWithOtp,
    signOut,
    updateProfile,
  };
});
