<template>
  <form class="row flex-center flex" @submit.prevent="handleLogin">
    <div class="col-6 form-widget">
      <h1 class="header">Sign in</h1>
      <p class="description">Sign in via magic link with your email below</p>
      <div>
        <q-input required type="email" placeholder="Your email" v-model="email" />
      </div>
      <div>
        <q-btn
          class="q-mt-md"
          color="primary"
          label="Send magic link"
          :loading="isLoading"
          type="submit"
        />
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';

const authStore = useAuthStore();

const email = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  await authStore.signInWithOtp(email.value);
  isLoading.value = false;
};
</script>
