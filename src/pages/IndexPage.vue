<template>
  <q-pull-to-refresh
    :disable="!$q.screen.lt.md"
    @refresh="onRefresh"
  >
    <section class="page-content-spacing">
      <div class="row justify-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <!-- Dashboard Header -->
          <DashboardHeader />

          <!-- Quick Actions Section (hidden on mobile) -->
          <QuickActionsGrid
            v-if="!$q.screen.lt.md"
            :can-add-expense="canAddExpense"
            :online="isOnline"
            @add-expense="openExpenseDialog"
          />

          <!-- Budget Hero Card -->
          <QueryErrorState
            v-if="plansLoadError"
            entity-name="Plans"
            :retrying="plansRetrying"
            class="section-spacing"
            @retry="retryPlans"
          />

          <BudgetOverviewCard
            v-else-if="primaryPlan && !isLoading"
            :plan="primaryPlan"
            :overview="primaryPlanOverview"
            :is-overview-loading="overviewLoading"
            :has-load-error="overviewLoadError"
            :is-retrying="overviewRetrying"
            class="section-spacing"
            @click="goToPlan"
            @retry="retryOverview"
          />

          <!-- Budget Hero Skeleton (shown while loading) -->
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
              <q-skeleton
                type="text"
                width="55%"
                height="48px"
              />
              <q-skeleton
                type="rect"
                height="8px"
                class="q-mt-md"
              />
              <q-skeleton
                type="text"
                width="50%"
                class="q-mt-xs"
              />
            </q-card-section>
          </q-card>

          <!-- Top Categories (primary plan) -->
          <TopCategoriesCard
            v-if="!plansLoadError && primaryPlan && !isLoading"
            :plan="primaryPlan"
            :overview="primaryPlanOverview"
            :has-load-error="overviewLoadError"
            :is-retrying="overviewRetrying"
            class="section-spacing"
            @click="goToPlan"
            @retry="retryOverview"
          />

          <!-- Recent Activity -->
          <RecentActivityCard
            v-if="!plansLoadError && activePlansCount > 0"
            :recent-expenses="recentExpenses"
            :is-loading="recentExpensesLoading"
            :has-load-error="recentExpensesLoadError"
            :is-retrying="recentExpensesRetrying"
            class="section-spacing"
            @retry="retryRecentExpenses"
          />

          <QueryErrorState
            v-if="$q.screen.lt.md && templatesLoadError"
            entity-name="Templates"
            :retrying="templatesRetrying"
            class="section-spacing"
            @retry="retryTemplates"
          />

          <!-- First-run: no active plans -->
          <EmptyPlansState
            v-if="!plansLoadError && !isLoading && activePlansCount === 0"
            class="section-spacing"
          />

          <!-- Mobile: compact links instead of full card sections -->
          <div
            v-if="$q.screen.lt.md && !plansLoadError && !templatesLoadError && activePlansCount > 0"
            class="mobile-dashboard-links section-spacing"
          >
            <q-list separator>
              <q-item
                clickable
                to="/plans"
              >
                <q-item-section
                  avatar
                  class="min-w-auto"
                >
                  <q-icon
                    name="eva-calendar-outline"
                    color="primary"
                    size="22px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">Active plans</q-item-label>
                  <q-item-label caption>Review budgets and progress</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-xs">
                    <q-badge
                      color="primary"
                      rounded
                    >
                      {{ activePlansCount }}
                    </q-badge>
                    <q-icon
                      name="eva-chevron-right-outline"
                      size="18px"
                    />
                  </div>
                </q-item-section>
              </q-item>

              <q-item
                clickable
                to="/templates"
              >
                <q-item-section
                  avatar
                  class="min-w-auto"
                >
                  <q-icon
                    name="eva-file-text-outline"
                    color="primary"
                    size="22px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">Templates</q-item-label>
                  <q-item-label caption>Reuse saved budget setups</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-xs">
                    <q-badge
                      color="primary"
                      rounded
                    >
                      {{ templatesCount }}
                    </q-badge>
                    <q-icon
                      name="eva-chevron-right-outline"
                      size="18px"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Desktop: full Active Plans section -->
          <DashboardSection
            v-if="!$q.screen.lt.md && !plansLoadError && activePlansCount > 0"
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
                :overview="overviewByPlanId[item.id] ?? null"
                :is-overview-loading="overviewLoading"
                :has-load-error="overviewLoadError"
                :is-retrying="overviewRetrying"
                @click="goToPlan"
                @retry="retryOverview"
              />
            </template>
            <template #empty>
              <EmptyPlansState />
            </template>
          </DashboardSection>

          <!-- Desktop: full Recent Templates section -->
          <QueryErrorState
            v-if="!$q.screen.lt.md && templatesLoadError"
            entity-name="Templates"
            :retrying="templatesRetrying"
            class="section-spacing"
            @retry="retryTemplates"
          />

          <DashboardSection
            v-else-if="!$q.screen.lt.md"
            title="Recent Templates"
            icon="eva-file-text-outline"
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
        v-if="canAddExpense && hasOpenedExpenseDialog"
        v-model="showExpenseDialog"
        auto-select-recent-plan
        @expense-created="onExpenseCreated"
      />

      <!-- Share Dialogs -->
      <SharePlanDialog
        v-if="sharePlanId"
        v-model="showSharePlanDialog"
        :plan-id="sharePlanId"
        :owner-user-id="activePlans.find((p) => p.id === sharePlanId)?.owner_id"
      />
      <ShareTemplateDialog
        v-if="shareTemplateId"
        v-model="showShareTemplateDialog"
        :template-id="shareTemplateId"
        :owner-user-id="templates.find((t) => t.id === shareTemplateId)?.owner_id"
      />
    </section>
  </q-pull-to-refresh>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMeta } from 'quasar'
import { useRouter } from 'vue-router'

useMeta({ title: 'Home' })
import { useUserStore } from 'src/stores/user'
import { useDashboardOverview } from 'src/composables/useDashboardOverview'
import DashboardHeader from 'src/components/dashboard/DashboardHeader.vue'
import QuickActionsGrid from 'src/components/dashboard/QuickActionsGrid.vue'
import DashboardSection from 'src/components/dashboard/DashboardSection.vue'
import BudgetOverviewCard from 'src/components/dashboard/BudgetOverviewCard.vue'
import TopCategoriesCard from 'src/components/dashboard/TopCategoriesCard.vue'
import RecentActivityCard from 'src/components/dashboard/RecentActivityCard.vue'
import PlanListItem from 'src/components/dashboard/PlanListItem.vue'
import TemplateListItem from 'src/components/dashboard/TemplateListItem.vue'
import EmptyPlansState from 'src/components/dashboard/EmptyPlansState.vue'
import EmptyTemplatesState from 'src/components/dashboard/EmptyTemplatesState.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import PlanCard from 'src/components/plans/PlanCard.vue'
import TemplateCard from 'src/components/templates/TemplateCard.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const {
  activePlans,
  templates,
  primaryPlan,
  primaryPlanOverview,
  overviewByPlanId,
  recentActivePlans,
  recentTemplates,
  recentExpenses,
  activePlansCount,
  templatesCount,
  canAddExpense,
  isOnline,
  isLoading,
  plansLoadError,
  templatesLoadError,
  overviewLoadError,
  recentExpensesLoadError,
  plansRetrying,
  templatesRetrying,
  overviewRetrying,
  overviewLoading,
  recentExpensesLoading,
  recentExpensesRetrying,
  retryPlans,
  retryTemplates,
  retryOverview,
  retryRecentExpenses,
  refreshDashboard,
  maxDisplayedItems,
} = useDashboardOverview()

async function onRefresh(done: () => void) {
  try {
    await refreshDashboard()
  } finally {
    done()
  }
}

const hasOpenedExpenseDialog = ref(false)
const showExpenseDialog = ref(false)
const showSharePlanDialog = ref(false)
const sharePlanId = ref<string | null>(null)
const showShareTemplateDialog = ref(false)
const shareTemplateId = ref<string | null>(null)
function openExpenseDialog() {
  if (!isOnline.value || !canAddExpense.value) return

  hasOpenedExpenseDialog.value = true
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
  const plan = activePlans.value.find((item) => item.id === planId)
  if (!plan || plan.owner_id !== userStore.userProfile?.id) return

  sharePlanId.value = planId
  showSharePlanDialog.value = true
}

function openShareTemplateDialog(templateId: string) {
  const template = templates.value.find((item) => item.id === templateId)
  if (!template || template.owner_id !== userStore.userProfile?.id) return

  shareTemplateId.value = templateId
  showShareTemplateDialog.value = true
}
</script>

<style lang="scss" scoped>
.mobile-dashboard-links {
  border-block: 1px solid hsl(var(--border));
}

.mobile-dashboard-links :deep(.q-item) {
  min-height: 56px;
  padding-inline: 4px;
}
</style>
