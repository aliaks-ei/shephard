<template>
  <section class="q-pa-sm q-pa-md-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <!-- Dashboard Header -->
        <DashboardHeader />

        <!-- Quick Actions Section -->
        <QuickActionsGrid @add-expense="openExpenseDialog" />

        <!-- Active Plans Section -->
        <DashboardSection
          title="Active Plans"
          icon="eva-calendar-outline"
          :items="recentActivePlans"
          :count="activePlansCount"
          :loading="isLoading"
          view-all-route="/plans"
          :max-displayed="maxDisplayedItems"
          :container-class="$q.screen.lt.sm ? '' : 'q-mb-lg'"
        >
          <template #card="{ item }">
            <PlanCard
              :plan="item"
              @edit="goToPlan"
              @share="openSharePlanDialog"
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
          :container-class="$q.screen.lt.sm ? '' : 'q-mb-lg'"
        >
          <template #card="{ item }">
            <TemplateCard
              :template="item"
              @edit="goToTemplate"
              @share="openShareTemplateDialog"
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

    <!-- Share Plan Dialog -->
    <SharePlanDialog
      v-if="selectedPlanId"
      v-model="showSharePlanDialog"
      :plan-id="selectedPlanId"
    />

    <!-- Share Template Dialog -->
    <ShareTemplateDialog
      v-if="selectedTemplateId"
      v-model="showShareTemplateDialog"
      :template-id="selectedTemplateId"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePlansStore } from 'src/stores/plans'
import { useTemplatesStore } from 'src/stores/templates'
import { useSortedRecentItems } from 'src/composables/useSortedRecentItems'
import DashboardHeader from 'src/components/dashboard/DashboardHeader.vue'
import QuickActionsGrid from 'src/components/dashboard/QuickActionsGrid.vue'
import DashboardSection from 'src/components/dashboard/DashboardSection.vue'
import EmptyPlansState from 'src/components/dashboard/EmptyPlansState.vue'
import EmptyTemplatesState from 'src/components/dashboard/EmptyTemplatesState.vue'
import PlanCard from 'src/components/plans/PlanCard.vue'
import TemplateCard from 'src/components/templates/TemplateCard.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'

const router = useRouter()
const plansStore = usePlansStore()
const templatesStore = useTemplatesStore()
const $q = useQuasar()

const showExpenseDialog = ref(false)
const showSharePlanDialog = ref(false)
const showShareTemplateDialog = ref(false)
const selectedPlanId = ref<string | null>(null)
const selectedTemplateId = ref<string | null>(null)
const isLoading = ref(true)
const maxDisplayedItems = 3

const activePlansCount = computed(() => plansStore.activePlans.length)
const templatesCount = computed(() => templatesStore.templates.length)

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

function openSharePlanDialog(planId: string) {
  selectedPlanId.value = planId
  showSharePlanDialog.value = true
}

function openShareTemplateDialog(templateId: string) {
  selectedTemplateId.value = templateId
  showShareTemplateDialog.value = true
}

onMounted(async () => {
  isLoading.value = true
  await Promise.all([plansStore.loadPlans(), templatesStore.loadTemplates()])
  isLoading.value = false
})
</script>
