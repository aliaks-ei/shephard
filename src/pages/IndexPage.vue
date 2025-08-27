<template>
  <div class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <div class="column items-center">
          <h2 class="q-mb-md">Welcome to Shephard</h2>
          <p class="text-subtitle1 text-center q-mb-xl">Your smart expenses wallet</p>

          <!-- Quick Actions Card -->
          <q-card class="shadow-2 full-width q-mb-lg">
            <q-card-section class="bg-primary text-white">
              <h3 class="text-h6 q-my-none">Quick Actions</h3>
            </q-card-section>

            <q-card-section>
              <q-list>
                <!-- Register Expense Button -->
                <q-item
                  clickable
                  v-ripple
                  @click="openExpenseDialog"
                  class="q-mb-sm"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="eva-plus-circle-outline"
                      color="positive"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">Register Expense</q-item-label>
                    <q-item-label caption>Track a new expense against your plans</q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator class="q-my-sm" />

                <!-- Existing actions -->
                <q-item
                  clickable
                  v-ripple
                  to="/settings"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="eva-settings-2-outline"
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
      </div>
    </div>

    <!-- Expense Registration Dialog -->
    <ExpenseRegistrationDialog
      v-model="showExpenseDialog"
      @expense-created="onExpenseCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationStore } from 'src/stores/notification'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'

const notificationStore = useNotificationStore()

const showExpenseDialog = ref(false)

function openExpenseDialog() {
  showExpenseDialog.value = true
}

function onExpenseCreated() {
  notificationStore.showSuccess('Expense registered successfully!')
  showExpenseDialog.value = false
}
</script>
