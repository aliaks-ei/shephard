<template>
  <section class="page-content-spacing">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <!-- Dashboard Header -->
        <DashboardHeader />

        <!-- Quick Actions Section (hidden on mobile) -->
        <QuickActionsGrid
          v-if="$q.screen.gt.sm"
          @add-expense="openExpenseDialog"
        />

        <!-- Budget Overview Card -->
        <BudgetOverviewCard
          v-if="primaryPlan && !isLoading"
          :plan="primaryPlan"
          class="section-spacing"
          @click="goToPlan"
        />

        <!-- Budget Overview Skeleton (shown while loading) -->
        <q-card
          v-else-if="isLoading"
          :bordered="$q.dark.isActive"
          class="shadow-1 section-spacing"
        >
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <q-skeleton
                type="text"
                width="40%"
              />
              <q-skeleton
                type="QChip"
                width="80px"
              />
            </div>
            <div class="row q-col-gutter-sm q-mb-sm">
              <div
                v-for="n in 3"
                :key="n"
                class="col"
              >
                <q-skeleton
                  type="text"
                  width="60%"
                />
                <q-skeleton
                  type="text"
                  width="80%"
                />
              </div>
            </div>
            <q-skeleton
              type="rect"
              height="8px"
            />
            <q-skeleton
              type="text"
              width="50%"
              class="q-mt-xs"
            />
          </q-card-section>
        </q-card>

        <!-- Active Plans Section -->
        <DashboardSection
          title="Active Plans"
          icon="eva-calendar-outline"
          :items="recentActivePlans"
          :count="activePlansCount"
          :loading="isLoading"
          view-all-route="/plans"
          :max-displayed="maxDisplayedItems"
          container-class="section-spacing"
        >
          <template #card="{ item }">
            <PlanCard
              :plan="item"
              @edit="goToPlan"
              @share="openSharePlanDialog"
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
          container-class="section-spacing"
        >
          <template #card="{ item }">
            <TemplateCard
              :template="item"
              @edit="goToTemplate"
              @share="openShareTemplateDialog"
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

    <!-- Share Dialogs -->
    <SharePlanDialog
      v-if="sharePlanId"
      v-model="showSharePlanDialog"
      :plan-id="sharePlanId"
    />
    <ShareTemplateDialog
      v-if="shareTemplateId"
      v-model="showShareTemplateDialog"
      :template-id="shareTemplateId"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlansQuery } from 'src/queries/plans'
import { useTemplatesQuery } from 'src/queries/templates'
import { useUserStore } from 'src/stores/user'
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
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const userId = computed(() => userStore.userProfile?.id)

const { activePlans, isPending: isPlansLoading } = usePlansQuery(userId)
const { templates, isPending: isTemplatesLoading, templatesCount } = useTemplatesQuery(userId)

const showExpenseDialog = ref(false)
const showSharePlanDialog = ref(false)
const sharePlanId = ref<string | null>(null)
const showShareTemplateDialog = ref(false)
const shareTemplateId = ref<string | null>(null)
const maxDisplayedItems = 3

const isLoading = computed(() => isPlansLoading.value || isTemplatesLoading.value)

const activePlansCount = computed(() => activePlans.value.length)

const primaryPlan = computed(() => {
  if (activePlans.value.length === 0) return null
  return [...activePlans.value].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() -
      new Date(a.updated_at || a.created_at).getTime(),
  )[0]
})

const recentActivePlans = useSortedRecentItems(activePlans, maxDisplayedItems)

const recentTemplates = useSortedRecentItems(templates, maxDisplayedItems)

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
  sharePlanId.value = planId
  showSharePlanDialog.value = true
}

function openShareTemplateDialog(templateId: string) {
  shareTemplateId.value = templateId
  showShareTemplateDialog.value = true
}
</script>
