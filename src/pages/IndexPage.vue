<template>
  <section class="q-pa-sm q-pa-md-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <!-- Dashboard Header -->
        <div class="q-mb-lg">
          <h1
            class="text-weight-medium q-my-none"
            :class="$q.screen.lt.md ? 'text-h5' : 'text-h4'"
          >
            Dashboard
          </h1>
          <p
            class="q-ma-none text-grey-6"
            :class="$q.screen.lt.md ? 'text-caption' : 'text-body2'"
          >
            Your expense tracking overview
          </p>
        </div>

        <!-- Quick Actions Section -->
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
              <q-card class="shadow-1">
                <q-item
                  clickable
                  :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'"
                  @click="openExpenseDialog"
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
              <q-card class="shadow-1">
                <q-item
                  clickable
                  :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'"
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
              <q-card class="shadow-1">
                <q-item
                  clickable
                  :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'"
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
              <q-card class="shadow-1">
                <q-item
                  clickable
                  :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'"
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

        <!-- Active Plans Section -->
        <div :class="$q.screen.lt.sm ? '' : 'q-mb-lg'">
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center">
              <q-icon
                name="eva-calendar-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 text-weight-medium q-my-none">Active Plans</h2>
              <q-chip
                :label="activePlansCount"
                color="primary"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              />
            </div>
            <q-btn
              v-if="activePlansCount > maxDisplayedItems"
              flat
              dense
              color="primary"
              label="View All"
              no-caps
              to="/plans"
            />
          </div>

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="row q-mb-xl"
            :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
          >
            <div
              v-for="i in skeletonCount"
              :key="`plan-skeleton-${i}`"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="shadow-1">
                <q-card-section>
                  <q-skeleton
                    type="text"
                    width="60%"
                  />
                  <q-skeleton
                    type="text"
                    width="40%"
                    class="q-mt-xl"
                  />
                  <q-skeleton
                    type="text"
                    width="30%"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Plans Grid - Desktop -->
          <div
            v-else-if="recentActivePlans.length > 0 && $q.screen.gt.xs"
            class="row"
            :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
          >
            <div
              v-for="plan in recentActivePlans"
              :key="plan.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <PlanCard
                :plan="plan"
                @edit="goToPlan"
              />
            </div>
          </div>

          <!-- Plans Carousel - Mobile -->
          <q-carousel
            v-else-if="recentActivePlans.length > 0 && $q.screen.lt.sm"
            v-model="plansCarouselSlide"
            transition-prev="slide-right"
            transition-next="slide-left"
            swipeable
            animated
            control-color="primary"
            control-type="flat"
            navigation-icon="eva-radio-button-off-outline"
            navigation-active-icon="eva-radio-button-on-outline"
            navigation
            padding
            height="auto"
            class="transparent"
          >
            <q-carousel-slide
              v-for="(plan, index) in recentActivePlans"
              :key="plan.id"
              :name="index"
              class="q-pa-none"
            >
              <PlanCard
                :plan="plan"
                @edit="goToPlan"
              />
            </q-carousel-slide>
          </q-carousel>

          <!-- Empty State -->
          <q-card
            v-else
            flat
            bordered
            class="text-center"
          >
            <q-card-section>
              <q-icon
                name="eva-calendar-outline"
                size="64px"
                color="grey-5"
                class="q-mb-md"
              />
              <div class="text-h6 text-grey-7 q-mb-sm">No Active Plans</div>
              <div class="text-body2 text-grey-6 q-mb-md">
                Create your first plan to start tracking expenses
              </div>
              <q-btn
                color="primary"
                label="Create Plan"
                icon="eva-plus-outline"
                unelevated
                no-caps
                to="/plans"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Recent Templates Section -->
        <div :class="$q.screen.lt.sm ? '' : 'q-mb-lg'">
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center">
              <q-icon
                name="eva-bookmark-outline"
                class="q-mr-sm"
                size="20px"
              />
              <h2 class="text-h6 text-weight-medium q-my-none">Recent Templates</h2>
              <q-chip
                :label="templatesCount"
                color="primary"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              />
            </div>
            <q-btn
              v-if="templatesCount > maxDisplayedItems"
              flat
              dense
              color="primary"
              label="View All"
              no-caps
              to="/templates"
            />
          </div>

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="row q-mb-xl"
            :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
          >
            <div
              v-for="i in skeletonCount"
              :key="`template-skeleton-${i}`"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="shadow-1">
                <q-card-section>
                  <q-skeleton
                    type="text"
                    width="60%"
                  />
                  <q-skeleton
                    type="text"
                    width="40%"
                    class="q-mt-xl"
                  />
                  <q-skeleton
                    type="text"
                    width="30%"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Templates Grid - Desktop -->
          <div
            v-else-if="recentTemplates.length > 0 && $q.screen.gt.xs"
            class="row"
            :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
          >
            <div
              v-for="template in recentTemplates"
              :key="template.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <TemplateCard
                :template="template"
                @edit="goToTemplate"
              />
            </div>
          </div>

          <!-- Templates Carousel - Mobile -->
          <q-carousel
            v-else-if="recentTemplates.length > 0 && $q.screen.lt.sm"
            v-model="templatesCarouselSlide"
            transition-prev="slide-right"
            transition-next="slide-left"
            swipeable
            animated
            control-color="primary"
            control-type="flat"
            navigation-icon="eva-radio-button-off-outline"
            navigation-active-icon="eva-radio-button-on-outline"
            navigation
            padding
            height="auto"
            class="transparent"
          >
            <q-carousel-slide
              v-for="(template, index) in recentTemplates"
              :key="template.id"
              :name="index"
              class="q-pa-none"
            >
              <TemplateCard
                :template="template"
                @edit="goToTemplate"
              />
            </q-carousel-slide>
          </q-carousel>

          <!-- Empty State -->
          <q-card
            v-else
            flat
            bordered
            class="text-center"
          >
            <q-card-section>
              <q-icon
                name="eva-bookmark-outline"
                size="64px"
                color="grey-5"
                class="q-mb-md"
              />
              <div class="text-h6 text-grey-7 q-mb-sm">No Templates Yet</div>
              <div class="text-body2 text-grey-6 q-mb-md">
                Create templates to quickly plan your budgets
              </div>
              <q-btn
                color="primary"
                label="Create Template"
                icon="eva-plus-outline"
                unelevated
                no-caps
                to="/templates"
              />
            </q-card-section>
          </q-card>
        </div>
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
import { useQuasar } from 'quasar'
import { usePlansStore } from 'src/stores/plans'
import { useTemplatesStore } from 'src/stores/templates'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import PlanCard from 'src/components/plans/PlanCard.vue'
import TemplateCard from 'src/components/templates/TemplateCard.vue'

const router = useRouter()
const plansStore = usePlansStore()
const templatesStore = useTemplatesStore()
const $q = useQuasar()

const showExpenseDialog = ref(false)
const isLoading = ref(true)
const maxDisplayedItems = 3

const plansCarouselSlide = ref(0)
const templatesCarouselSlide = ref(0)

const activePlansCount = computed(() => plansStore.activePlans.length)
const templatesCount = computed(() => templatesStore.templates.length)
const skeletonCount = computed(() => ($q.screen.lt.sm ? 1 : maxDisplayedItems))

const recentActivePlans = computed(() => {
  return [...plansStore.activePlans]
    .filter((p) => p.updated_at)
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime()
      const dateB = new Date(b.updated_at || 0).getTime()
      return dateB - dateA
    })
    .slice(0, maxDisplayedItems)
})

const recentTemplates = computed(() => {
  return [...templatesStore.templates]
    .filter((t) => t.updated_at)
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime()
      const dateB = new Date(b.updated_at || 0).getTime()
      return dateB - dateA
    })
    .slice(0, maxDisplayedItems)
})

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
