<template>
  <div
    class="row justify-center items-center q-pa-md"
    style="min-height: 100vh"
  >
    <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4">
      <q-card
        flat
        bordered
        :class="$q.screen.lt.md ? 'q-pa-xs' : 'q-pa-md'"
      >
        <q-card-section class="text-center q-pb-none">
          <!-- App Icon -->
          <q-icon
            name="eva-trending-up-outline"
            size="56px"
            color="primary"
            class="q-mb-md"
          />

          <!-- Welcome Heading -->
          <h1
            :class="$q.screen.lt.md ? 'text-h4' : 'text-h3'"
            class="text-weight-medium q-mt-none q-mb-sm"
          >
            Welcome to Shephard
          </h1>

          <!-- Subtitle -->
          <p class="text-subtitle1 text-grey-7 q-mb-none">
            Your smart expense management companion
          </p>
        </q-card-section>

        <q-card-section :class="$q.screen.lt.md ? 'q-pt-md' : 'q-pt-lg'">
          <!-- Email OTP Authentication -->
          <EmailOtpForm />

          <!-- Divider with OR -->
          <div class="row items-center q-my-lg">
            <div class="col">
              <q-separator />
            </div>
            <div class="col-auto q-px-md">
              <span class="text-body2 text-grey-6">OR</span>
            </div>
            <div class="col">
              <q-separator />
            </div>
          </div>

          <!-- Google Authentication -->
          <GoogleAuthButton />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import GoogleAuthButton from 'src/components/GoogleAuthButton.vue'
import EmailOtpForm from 'src/components/EmailOtpForm.vue'

const $q = useQuasar()
</script>
