<template>
  <div class="row fit">
    <!-- Brand Panel (desktop only) -->
    <div class="col-6 gt-sm column items-center flex justify-center q-pa-xl bg-primary text-white">
      <div class="text-center flex column items-center">
        <!-- Logo -->
        <q-avatar
          size="80px"
          color="white-10"
          text-color="white"
          class="q-mb-lg"
        >
          <q-icon
            name="eva-trending-up-outline"
            size="40px"
          />
        </q-avatar>

        <!-- App name -->
        <div class="text-h3 text-weight-bold q-mb-sm">Shephard</div>

        <!-- Tagline -->
        <div class="text-subtitle1 text-white-7">Smart budget management and expense tracking</div>

        <!-- Features list -->
        <div class="q-mt-xl text-left">
          <div
            v-for="feature in features"
            :key="feature.icon"
            class="row items-center no-wrap q-mb-md text-white-7"
          >
            <q-avatar
              size="32px"
              color="white-10"
              text-color="white"
              class="q-mr-md"
            >
              <q-icon
                :name="feature.icon"
                size="18px"
              />
            </q-avatar>
            <span class="text-body2">{{ feature.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Panel -->
    <div class="col-12 col-md-6 column items-center justify-center q-pa-md window-height">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
const features = [
  { icon: 'eva-credit-card-outline', text: 'Create and manage budget plans' },
  { icon: 'eva-people-outline', text: 'Share budgets with family and friends' },
  { icon: 'eva-camera-outline', text: 'AI-powered receipt scanning' },
]
</script>
