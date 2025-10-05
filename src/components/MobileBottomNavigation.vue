<template>
  <div v-if="visible !== false">
    <!-- Bottom Navigation Bar -->
    <q-page-sticky
      position="bottom"
      expand
      :offset="[0, 0]"
      class="mobile-bottom-nav"
    >
      <div
        class="full-width shadow-up-1 q-pt-sm q-px-sm mobile-bottom-nav-content"
        :class="[$q.dark.isActive ? 'bg-dark text-white' : 'bg-white']"
      >
        <div class="row q-gutter-xs items-end">
          <!-- Home -->
          <div class="col">
            <q-btn
              icon="eva-home-outline"
              label="Home"
              to="/"
              :color="isActive('/') ? 'primary' : undefined"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width"
            />
          </div>

          <!-- Plans -->
          <div class="col">
            <q-btn
              icon="eva-calendar-outline"
              label="Plans"
              to="/plans"
              :color="isActive('/plans') ? 'primary' : undefined"
              size="sm"
              flat
              stack
              no-caps
              dense
              class="full-width"
            />
          </div>

          <!-- Add Expense FAB -->
          <div class="col text-center">
            <q-btn
              icon="eva-plus-outline"
              round
              color="primary"
              size="md"
              @click="emit('open-expense-dialog')"
            />
          </div>

          <!-- Templates -->
          <div class="col">
            <q-btn
              icon="eva-file-text-outline"
              label="Templates"
              to="/templates"
              :color="isActive('/templates') ? 'primary' : undefined"
              size="sm"
              flat
              stack
              no-caps
              dense
              class="full-width"
            />
          </div>

          <!-- Categories -->
          <div class="col">
            <q-btn
              icon="eva-grid-outline"
              label="Categories"
              to="/categories"
              :color="isActive('/categories') ? 'primary' : undefined"
              size="sm"
              flat
              stack
              no-caps
              dense
              class="full-width"
            />
          </div>
        </div>
      </div>
    </q-page-sticky>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

const emit = defineEmits<{
  (e: 'open-expense-dialog'): void
}>()

withDefaults(
  defineProps<{
    visible?: boolean
  }>(),
  {
    visible: true,
  },
)

const route = useRoute()
const $q = useQuasar()

const isActive = (itemTo: string) => {
  if (itemTo === '/') {
    return route.fullPath === '/'
  }

  return route.fullPath.startsWith(itemTo)
}
</script>

<style scoped>
.mobile-bottom-nav {
  z-index: 2000;
}

.mobile-bottom-nav-content {
  padding-bottom: max(8px, calc(8px + env(safe-area-inset-bottom, 0px)));
}
</style>
