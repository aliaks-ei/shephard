<template>
  <div class="row justify-center q-pa-md">
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <div class="row items-center justify-between wrap q-col-gutter-md q-mb-lg">
        <div class="col-auto">
          <h1 class="text-h4 text-weight-medium q-mb-sm q-mt-none">Plans</h1>
          <p class="text-body2 text-grey-6 q-mb-none">
            Manage your financial plans and track your progress
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="eva-plus-outline"
            label="Create Plan"
            unelevated
            @click="goToNewPlan"
          />
        </div>
      </div>

      <q-card
        class="q-mb-lg"
        flat
        bordered
      >
        <q-card-section>
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="searchQuery"
                placeholder="Search plans..."
                debounce="300"
                outlined
                clearable
              >
                <template #prepend>
                  <q-icon name="eva-search-outline" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                label="Filter by Status"
                outlined
                emit-value
                clearable
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="sortBy"
                :options="sortOptions"
                label="Sort by"
                outlined
                emit-value
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div v-if="arePlansLoading">
        <div class="row q-col-gutter-lg">
          <div
            v-for="n in 6"
            :key="n"
            class="col-12 col-sm-6 col-lg-4 col-xl-3"
          >
            <q-card
              flat
              bordered
            >
              <q-card-section>
                <q-skeleton
                  type="text"
                  width="60%"
                  height="24px"
                  class="q-mb-sm"
                />
                <q-skeleton
                  type="text"
                  width="40%"
                  height="16px"
                  class="q-mb-md"
                />
                <q-skeleton
                  type="text"
                  width="80%"
                  height="16px"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <div
        v-else-if="hasPlans"
        class="column q-col-gutter-xl"
      >
        <div v-if="filteredAndSortedActivePlans.length > 0">
          <PlansGroup
            title="Active Plans"
            :plans="filteredAndSortedActivePlans"
            chip-color="green"
            @edit="viewPlan"
            @delete="deletePlan"
            @share="openShareDialog"
          />
        </div>

        <div v-if="filteredAndSortedPendingPlans.length > 0">
          <PlansGroup
            title="Pending Plans"
            :plans="filteredAndSortedPendingPlans"
            chip-color="orange"
            @edit="viewPlan"
            @delete="deletePlan"
            @share="openShareDialog"
          />
        </div>

        <div v-if="filteredAndSortedOwnedPlans.length > 0">
          <PlansGroup
            title="My Plans"
            :plans="filteredAndSortedOwnedPlans"
            @edit="viewPlan"
            @delete="deletePlan"
            @share="openShareDialog"
          />
        </div>

        <div v-if="filteredAndSortedSharedPlans.length > 0">
          <PlansGroup
            title="Shared with Me"
            :plans="filteredAndSortedSharedPlans"
            chip-color="secondary"
            hide-shared-badge
            @edit="viewPlan"
            @delete="deletePlan"
            @share="openShareDialog"
          />
        </div>

        <div v-if="filteredAndSortedCompletedPlans.length > 0">
          <PlansGroup
            title="Completed Plans"
            :plans="filteredAndSortedCompletedPlans"
            chip-color="grey"
            @edit="viewPlan"
            @delete="deletePlan"
            @share="openShareDialog"
          />
        </div>
      </div>

      <q-card
        v-else
        flat
        class="text-center q-py-xl"
      >
        <q-card-section>
          <q-icon
            :name="searchQuery || statusFilter ? 'eva-search-outline' : 'eva-calendar-outline'"
            size="4rem"
            class="text-grey-4 q-mb-md"
          />

          <div class="text-h5 q-mb-sm text-grey-7">
            {{ searchQuery || statusFilter ? 'No plans found' : 'No plans yet' }}
          </div>

          <div class="text-body2 text-grey-5 q-mb-lg">
            {{
              searchQuery || statusFilter
                ? 'Try adjusting your search terms or filters, or create a new plan'
                : 'Create your first plan from a template to start tracking your financial goals'
            }}
          </div>

          <div class="q-gutter-sm">
            <q-btn
              v-if="searchQuery"
              flat
              color="primary"
              icon="eva-close-outline"
              label="Clear Search"
              @click="searchQuery = ''"
            />
            <q-btn
              v-if="statusFilter"
              flat
              color="primary"
              icon="eva-funnel-outline"
              label="Clear Filter"
              @click="statusFilter = null"
            />
            <q-btn
              color="primary"
              icon="eva-plus-outline"
              label="Create Your First Plan"
              unelevated
              @click="goToNewPlan"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <SharePlanDialog
      v-if="sharePlanId"
      v-model="isShareDialogOpen"
      :plan-id="sharePlanId"
      @shared="onPlanShared"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import PlansGroup from 'src/components/plans/PlansGroup.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import { usePlansStore } from 'src/stores/plans'
import { useNotificationStore } from 'src/stores/notification'
import { getPlanStatus } from 'src/utils/plans'
import type { PlanWithPermission } from 'src/api'

const router = useRouter()
const plansStore = usePlansStore()
const notificationsStore = useNotificationStore()

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const sortBy = ref('created_at')
const isShareDialogOpen = ref(false)
const sharePlanId = ref<string | null>(null)

const arePlansLoading = computed(() => plansStore.isLoading)
const allPlans = computed(() => plansStore.plans)

// Filter plans by search query and status
const filteredPlans = computed(() => {
  let filtered = allPlans.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((plan) => plan.name.toLowerCase().includes(query))
  }

  if (statusFilter.value) {
    filtered = filtered.filter((plan) => getPlanStatus(plan) === statusFilter.value)
  }

  return filtered
})

// Sort plans
const sortedPlans = computed(() => {
  const sorted = [...filteredPlans.value]

  switch (sortBy.value) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'total':
      return sorted.sort((a, b) => (b.total || 0) - (a.total || 0))
    case 'start_date':
      return sorted.sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      )
    case 'created_at':
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime(),
      )
  }
})

// Group plans by status and ownership
const filteredAndSortedActivePlans = computed(() =>
  sortedPlans.value.filter((plan) => getPlanStatus(plan) === 'active'),
)

const filteredAndSortedPendingPlans = computed(() =>
  sortedPlans.value.filter((plan) => getPlanStatus(plan) === 'pending'),
)

const filteredAndSortedCompletedPlans = computed(() =>
  sortedPlans.value.filter((plan) => getPlanStatus(plan) === 'completed'),
)

const filteredAndSortedOwnedPlans = computed(() => {
  if (statusFilter.value) return [] // Don't show owned/shared groups when filtering by status
  return sortedPlans.value.filter((plan) => plan.owner_id === plansStore.userId)
})

const filteredAndSortedSharedPlans = computed(() => {
  if (statusFilter.value) return [] // Don't show owned/shared groups when filtering by status
  return sortedPlans.value.filter((plan) => plan.owner_id !== plansStore.userId)
})

const hasPlans = computed(() => allPlans.value.length > 0)

const statusOptions = computed(() => [
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
])

const sortOptions = computed(() => [
  { label: 'Name', value: 'name' },
  { label: 'Total Amount', value: 'total' },
  { label: 'Start Date', value: 'start_date' },
  { label: 'Created Date', value: 'created_at' },
])

function goToNewPlan(): void {
  router.push({ name: 'new-plan' })
}

function viewPlan(planId: string): void {
  router.push({ name: 'plan', params: { id: planId } })
}

function deletePlan(plan: PlanWithPermission): void {
  // This will be handled by the PlanCard component's delete dialog
  console.log('Delete plan:', plan.id)
}

function openShareDialog(planId: string): void {
  sharePlanId.value = planId
  isShareDialogOpen.value = true
}

function onPlanShared(): void {
  plansStore.loadPlans()
  notificationsStore.showSuccess('Plan shared successfully')
}

onMounted(async () => {
  await plansStore.loadPlans()
})

onUnmounted(() => {
  plansStore.reset()
})
</script>
