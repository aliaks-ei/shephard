<template>
  <q-card
    flat
    bordered
    class="full-width q-pa-sm auth-login-card"
  >
    <q-card-section class="text-center">
      <!-- Mobile logo (shown only on mobile) -->
      <q-avatar
        size="48px"
        color="primary"
        text-color="white"
        class="lt-md q-mb-md"
      >
        <q-icon
          name="eva-trending-up-outline"
          size="24px"
        />
      </q-avatar>

      <div class="text-h5 text-weight-medium q-mb-xs">Welcome to Shephard</div>
      <div class="text-body2 text-grey-7">Sign in to your account to continue</div>
    </q-card-section>

    <q-card-section>
      <slot />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.auth-login-card {
  max-width: 400px;
}
</style>
