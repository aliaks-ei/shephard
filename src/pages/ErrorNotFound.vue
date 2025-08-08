<template>
  <div class="fullscreen column flex-center q-pa-xl">
    <div
      class="column items-center text-center"
      style="max-width: 600px"
    >
      <q-icon
        name="eva-alert-triangle-outline"
        size="80px"
        color="primary"
        class="q-mb-lg"
      />

      <div class="text-h1 text-weight-bold text-primary q-mb-md">404</div>

      <div class="text-h5 q-mb-lg text-primary">Page Not Found</div>

      <div class="text-body1 q-mb-xl">
        The page you're looking for doesn't exist or has been moved. <br />
        Let's get you back on track with these helpful options:
      </div>

      <div class="row q-gutter-md">
        <q-btn
          color="primary"
          unelevated
          icon="eva-home-outline"
          label="Go to Home"
          to="/"
          no-caps
          class="q-py-md q-px-lg"
          aria-label="Go to Home"
        />

        <q-btn
          color="primary"
          unelevated
          icon="eva-clipboard-outline"
          label="View Plans"
          :to="{ name: 'plans' }"
          no-caps
          class="q-py-md q-px-lg"
          aria-label="Go to Plans"
        />

        <q-btn
          color="primary"
          unelevated
          icon="eva-settings-outline"
          label="Open Settings"
          :to="{ name: 'settings' }"
          no-caps
          class="q-py-md q-px-lg"
          aria-label="Open Settings"
        />
      </div>
    </div>
  </div>
</template>
