<template>
  <q-pull-to-refresh
    :disable="$q.screen.gt.sm"
    @refresh="onRefresh"
  >
    <section class="page-content-spacing">
      <div class="row justify-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <!-- Dashboard Header -->
          <DashboardHeader />

          <!-- Quick Actions Section (hidden on mobile) -->
          <QuickActionsGrid
            v-if="$q.screen.gt.sm"
            @add-expense="openExpenseDialog"
          />

          <!-- Budget Hero Card -->
          <BudgetOverviewCard
            v-if="primaryPlan && !isLoading"
            :plan="primaryPlan"
            class="section-spacing"
            @click="goToPlan"
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
            v-if="primaryPlan && !isLoading"
            :plan="primaryPlan"
            class="section-spacing"
            @click="goToPlan"
          />

          <!-- Recent Activity -->
          <RecentActivityCard
            v-if="activePlansCount > 0"
            class="section-spacing"
          />

          <!-- First-run: no active plans -->
          <EmptyPlansState
            v-if="!isLoading && activePlansCount === 0"
            class="section-spacing"
          />

          <!-- Mobile: compact links instead of full card sections -->
          <q-card
            v-if="$q.screen.lt.md && activePlansCount > 0"
            :bordered="$q.dark.isActive"
            class="shadow-1 section-spacing"
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
          </q-card>

          <!-- Desktop: full Active Plans section -->
          <DashboardSection
            v-if="$q.screen.gt.sm && activePlansCount > 0"
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

          <!-- Desktop: full Recent Templates section -->
          <DashboardSection
            v-if="$q.screen.gt.sm"
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
        v-if="hasOpenedExpenseDialog"
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
import { ref, computed } from 'vue'
import { useMeta } from 'quasar'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from 'src/queries/query-keys'

useMeta({ title: 'Home' })
import { usePlansQuery } from 'src/queries/plans'
import { useTemplatesQuery } from 'src/queries/templates'
import { useUserStore } from 'src/stores/user'
import { useSortedRecentItems } from 'src/composables/useSortedRecentItems'
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
import PlanCard from 'src/components/plans/PlanCard.vue'
import TemplateCard from 'src/components/templates/TemplateCard.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const queryClient = useQueryClient()
const userId = computed(() => userStore.userProfile?.id)

async function onRefresh(done: () => void) {
  try {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.recentAll() }),
    ])
  } finally {
    done()
  }
}

const { activePlans, isPending: isPlansLoading } = usePlansQuery(userId)
const { templates, isPending: isTemplatesLoading, templatesCount } = useTemplatesQuery(userId)

const hasOpenedExpenseDialog = ref(false)
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
  sharePlanId.value = planId
  showSharePlanDialog.value = true
}

function openShareTemplateDialog(templateId: string) {
  shareTemplateId.value = templateId
  showShareTemplateDialog.value = true
}
</script>
