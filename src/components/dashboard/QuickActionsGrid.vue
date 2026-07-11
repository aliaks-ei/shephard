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
    <div class="row q-col-gutter-md">
      <div
        v-for="action in quickActions"
        :key="action.label"
        class="col-3"
      >
        <q-card
          :bordered="$q.dark.isActive"
          class="shadow-1"
        >
          <q-item
            clickable
            class="q-py-sm q-px-md"
            :to="action.to"
            :disable="
              (action.requiresExpensePlan && !props.canAddExpense) ||
              (action.requiresOnline && !props.online)
            "
            @click="action.action ? action.action() : undefined"
          >
            <q-item-section>
              <div class="row items-center q-gutter-sm">
                <q-icon
                  :name="action.icon"
                  size="24px"
                  :color="action.color"
                />
                <div class="text-subtitle2">{{ action.label }}</div>
              </div>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    canAddExpense?: boolean
    online?: boolean
  }>(),
  {
    canAddExpense: true,
    online: true,
  },
)

const emit = defineEmits<{
  'add-expense': []
}>()

type QuickAction = {
  label: string
  icon: string
  color: string
  to?: string
  action?: () => void
  requiresExpensePlan?: boolean
  requiresOnline?: boolean
}

const quickActions = computed<QuickAction[]>(() => [
  {
    label: 'Add Expense',
    icon: 'eva-plus-circle-outline',
    color: 'positive',
    requiresExpensePlan: true,
    requiresOnline: true,
    action: () => {
      if (props.canAddExpense) {
        emit('add-expense')
      }
    },
  },
  {
    label: 'New Plan',
    icon: 'eva-calendar-outline',
    color: 'primary',
    to: '/plans/new',
    requiresOnline: true,
  },
  {
    label: 'New Template',
    icon: 'eva-file-text-outline',
    color: 'primary',
    to: '/templates/new',
    requiresOnline: true,
  },
  {
    label: 'Settings',
    icon: 'eva-settings-2-outline',
    color: 'warning',
    to: '/settings',
  },
])
</script>
