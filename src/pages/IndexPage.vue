<template>
  <section class="q-pa-xs q-pa-md-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <!-- Dashboard Header -->
        <DashboardHeader />

        <!-- Quick Actions Section (hidden on mobile) -->
        <QuickActionsGrid
          v-if="$q.screen.gt.xs"
          @add-expense="openExpenseDialog"
        />

        <!-- Budget Overview Card -->
        <BudgetOverviewCard
          v-if="primaryPlan && !isLoading"
          :plan="primaryPlan"
          :class="$q.screen.lt.sm ? 'q-mb-md' : 'q-mb-lg'"
          @click="goToPlan"
        />

        <!-- Active Plans Section -->
        <DashboardSection
          title="Active Plans"
          icon="eva-calendar-outline"
          :items="recentActivePlans"
          :count="activePlansCount"
          :loading="isLoading"
          view-all-route="/plans"
          :max-displayed="maxDisplayedItems"
          :container-class="$q.screen.lt.sm ? 'q-mb-md' : 'q-mb-lg'"
        >
          <template #card="{ item }">
            <PlanCard
              :plan="item"
              @edit="goToPlan"
            />
          </template>
          <template #list-item="{ item }">
            <PlanListItem
              :plan="item"
              @click="goToPlan"
            />
          </template>
          <template #empty>
            <EmptyPlansState />
          </template>
        </DashboardSection>

        <!-- Recent Templates Section -->
        <DashboardSection
          title="Recent Templates"
          icon="eva-bookmark-outline"
          :items="recentTemplates"
          :count="templatesCount"
          :loading="isLoading"
          view-all-route="/templates"
          :max-displayed="maxDisplayedItems"
          :container-class="$q.screen.lt.sm ? 'q-mb-md' : 'q-mb-lg'"
        >
          <template #card="{ item }">
            <TemplateCard
              :template="item"
              @edit="goToTemplate"
            />
          </template>
          <template #list-item="{ item }">
            <TemplateListItem
              :template="item"
              @click="goToTemplate"
            />
          </template>
          <template #empty>
            <EmptyTemplatesState />
          </template>
        </DashboardSection>
      </div>
    </div>

    <!-- Expense Registration Dialog -->
    <ExpenseRegistrationDialog
      v-model="showExpenseDialog"
      auto-select-recent-plan
      @expense-created="onExpenseCreated"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlansStore } from 'src/stores/plans'
import { useTemplatesStore } from 'src/stores/templates'
import { useSortedRecentItems } from 'src/composables/useSortedRecentItems'
import DashboardHeader from 'src/components/dashboard/DashboardHeader.vue'
import QuickActionsGrid from 'src/components/dashboard/QuickActionsGrid.vue'
import DashboardSection from 'src/components/dashboard/DashboardSection.vue'
import BudgetOverviewCard from 'src/components/dashboard/BudgetOverviewCard.vue'
import PlanListItem from 'src/components/dashboard/PlanListItem.vue'
import TemplateListItem from 'src/components/dashboard/TemplateListItem.vue'
import EmptyPlansState from 'src/components/dashboard/EmptyPlansState.vue'
import EmptyTemplatesState from 'src/components/dashboard/EmptyTemplatesState.vue'
import PlanCard from 'src/components/plans/PlanCard.vue'
import TemplateCard from 'src/components/templates/TemplateCard.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'

const router = useRouter()
const plansStore = usePlansStore()
const templatesStore = useTemplatesStore()

const showExpenseDialog = ref(false)
const isLoading = ref(true)
const maxDisplayedItems = 3

const templatesCount = computed(() => templatesStore.templates.length)

const activePlansCount = computed(() => plansStore.activePlans.length)

const primaryPlan = computed(() => {
  if (plansStore.activePlans.length === 0) return null
  return [...plansStore.activePlans].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() -
      new Date(a.updated_at || a.created_at).getTime(),
  )[0]
})

const recentActivePlans = useSortedRecentItems(
  computed(() => plansStore.activePlans),
  maxDisplayedItems,
)

const recentTemplates = useSortedRecentItems(
  computed(() => templatesStore.templates),
  maxDisplayedItems,
)

function openExpenseDialog() {
  showExpenseDialog.value = true
}

function onExpenseCreated() {
  showExpenseDialog.value = false
}

function goToPlan(planId: string) {
  router.push({ name: 'plan', params: { id: planId } })
}

function goToTemplate(templateId: string) {
  router.push({ name: 'template', params: { id: templateId } })
}

onMounted(async () => {
  isLoading.value = true
  await Promise.all([plansStore.loadPlans(), templatesStore.loadTemplates()])
  isLoading.value = false
})
</script>
