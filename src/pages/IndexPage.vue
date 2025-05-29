<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center">
      <h2 class="q-mb-md">Welcome to Shephard</h2>
      <p class="text-subtitle1 text-center q-mb-xl">Your smart expenses wallet</p>

      <q-card
        class="shadow-2"
        style="width: 350px"
      >
        <q-card-section class="bg-primary text-white">
          <h3 class="text-h6 q-my-none">Quick Actions</h3>
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item
              clickable
              v-ripple
              to="/settings"
            >
              <q-item-section avatar>
                <q-icon
                  name="settings"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>User Settings</q-item-label>
                <q-item-label
                  caption
                  class="text-caption"
                >
                  Manage your account settings
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
