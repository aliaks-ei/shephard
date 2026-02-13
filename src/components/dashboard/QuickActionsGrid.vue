<template>
  <div class="q-mb-lg">
    <div class="row items-center q-mb-md">
      <q-icon
        name="eva-flash-outline"
        class="q-mr-sm"
        size="20px"
      />
      <h2 class="text-h6 text-weight-medium q-my-none">Quick Actions</h2>
    </div>

    <!-- Quick Actions Grid -->
    <div
      class="row"
      :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
    >
      <div class="col-6 col-sm-3">
        <q-card
          :bordered="$q.dark.isActive"
          class="shadow-1"
        >
          <q-item
            clickable
            :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
            @click="$emit('add-expense')"
          >
            <q-item-section>
              <div class="row items-center q-gutter-sm">
                <q-icon
                  name="eva-plus-circle-outline"
                  size="24px"
                  color="positive"
                />
                <div class="text-subtitle2">Add Expense</div>
              </div>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card
          :bordered="$q.dark.isActive"
          class="shadow-1"
        >
          <q-item
            clickable
            :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
            @click="$router.push('/plans/new')"
          >
            <q-item-section>
              <div class="row items-center q-gutter-sm">
                <q-icon
                  name="eva-calendar-outline"
                  size="24px"
                  color="primary"
                />
                <div class="text-subtitle2">New Plan</div>
              </div>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card
          :bordered="$q.dark.isActive"
          class="shadow-1"
        >
          <q-item
            clickable
            :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
            @click="$router.push('/templates/new')"
          >
            <q-item-section>
              <div class="row items-center q-gutter-sm">
                <q-icon
                  name="eva-file-text-outline"
                  size="24px"
                  color="primary"
                />
                <div class="text-subtitle2">New Template</div>
              </div>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card
          :bordered="$q.dark.isActive"
          class="shadow-1"
        >
          <q-item
            clickable
            :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
            @click="$router.push('/settings')"
          >
            <q-item-section>
              <div class="row items-center q-gutter-sm">
                <q-icon
                  name="eva-settings-2-outline"
                  size="24px"
                  color="warning"
                />
                <div class="text-subtitle2">Settings</div>
              </div>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

defineEmits<{
  'add-expense': []
}>()

const $q = useQuasar()
const $router = useRouter()
</script>
