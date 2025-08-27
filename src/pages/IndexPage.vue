<template>
  <section>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="text-center q-pa-lg">
            <div class="row items-center justify-center q-gutter-md">
              <q-icon
                name="eva-credit-card-outline"
                size="48px"
                color="primary"
              />
              <div>
                <h1 class="text-h3 text-primary q-my-none">Shephard</h1>
                <p class="text-body1 q-ma-none text-grey-7">Your smart expense wallet</p>
              </div>
            </div>
            <q-separator class="q-my-md" />
            <p class="text-body2 q-mb-none">
              Choose your next action to manage your expenses effectively
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="q-px-md q-py-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-card>
                <q-item
                  clickable
                  @click="openExpenseDialog"
                  class="text-center q-pa-lg"
                >
                  <q-item-section class="items-center">
                    <q-icon
                      name="eva-plus-circle-outline"
                      size="40px"
                      color="positive"
                    />
                    <h3 class="text-h6 q-mb-none">Quick Entry</h3>
                    <p class="text-caption text-grey-6 q-mb-none">Register expenses fast</p>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
            <div class="col-6">
              <q-card>
                <q-item
                  clickable
                  to="/plans"
                  class="text-center q-pa-lg"
                >
                  <q-item-section class="items-center">
                    <q-icon
                      name="eva-calendar-outline"
                      size="40px"
                      color="primary"
                    />
                    <h3 class="text-h6 q-mb-none">View Plans</h3>
                    <p class="text-caption text-grey-6 q-mb-none">Manage your budgets</p>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-xs">
            <div class="col-4">
              <q-card class="full-height">
                <q-item
                  clickable
                  to="/templates"
                  class="full-height text-center q-pa-md"
                >
                  <q-item-section class="items-center">
                    <q-icon
                      name="eva-bookmark-outline"
                      size="24px"
                      color="secondary"
                    />
                    <h3 class="text-subtitle2 q-mb-none q-mt-sm">Templates</h3>
                    <p class="text-caption text-grey-6 q-mb-none">Create reusable patterns</p>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
            <div class="col-4">
              <q-card class="full-height">
                <q-item
                  clickable
                  to="/categories"
                  class="full-height text-center q-pa-md"
                >
                  <q-item-section class="items-center">
                    <q-icon
                      name="eva-grid-outline"
                      size="24px"
                      color="info"
                    />
                    <h3 class="text-subtitle2 q-mb-none q-mt-sm">Categories</h3>
                    <p class="text-caption text-grey-6 q-mb-none">Organize your expenses</p>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
            <div class="col-4">
              <q-card class="full-height">
                <q-item
                  clickable
                  to="/settings"
                  class="full-height text-center q-pa-md"
                >
                  <q-item-section class="items-center">
                    <q-icon
                      name="eva-settings-2-outline"
                      size="24px"
                      color="warning"
                    />
                    <h3 class="text-subtitle2 q-mb-none q-mt-sm">Settings</h3>
                    <p class="text-caption text-grey-6 q-mb-none">Manage your account</p>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ExpenseRegistrationDialog
      v-model="showExpenseDialog"
      @expense-created="onExpenseCreated"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationStore } from 'src/stores/notification'
import { usePlansStore } from 'src/stores/plans'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'

const notificationStore = useNotificationStore()
const plansStore = usePlansStore()

const showExpenseDialog = ref(false)

onMounted(async () => {
  await plansStore.loadPlans()
})

function openExpenseDialog() {
  showExpenseDialog.value = true
}

function onExpenseCreated() {
  notificationStore.showSuccess('Expense registered successfully!')
  showExpenseDialog.value = false
}
</script>
