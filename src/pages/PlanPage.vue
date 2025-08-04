<template>
  <div class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <q-toolbar class="q-mb-lg q-px-none">
          <q-btn
            flat
            round
            icon="eva-arrow-back-outline"
            @click="goBack"
          />

          <q-toolbar-title>
            <div class="row items-center">
              <q-icon
                :name="pageIcon"
                size="sm"
                class="q-mr-sm"
              />
              {{ pageTitle }}
            </div>
          </q-toolbar-title>

          <q-btn
            v-if="!isNewPlan && isOwner && canEditPlanData"
            flat
            round
            icon="eva-share-outline"
            @click="openShareDialog"
          />
        </q-toolbar>

        <q-breadcrumbs
          class="q-mb-lg text-grey-6"
          active-color="primary"
        >
          <q-breadcrumbs-el
            label="Plans"
            icon="eva-calendar-outline"
            to="/plans"
          />
          <q-breadcrumbs-el
            :label="breadcrumbLabel"
            :icon="breadcrumbIcon"
          />
        </q-breadcrumbs>

        <q-banner
          v-if="isReadOnlyMode"
          class="bg-orange-1 text-orange-8 q-mb-lg"
          rounded
        >
          <template #avatar>
            <q-icon name="eva-eye-outline" />
          </template>
          You're viewing this plan in read-only mode. Contact the owner for edit access.
        </q-banner>

        <q-banner
          v-if="!isNewPlan && !canEditPlanData && isOwner"
          class="bg-grey-2 text-grey-8 q-mb-lg"
          rounded
        >
          <template #avatar>
            <q-icon name="eva-lock-outline" />
          </template>
          This plan cannot be edited because it's {{ currentPlanStatus }} or completed.
        </q-banner>

        <div v-if="isPlanLoading">
          <div class="q-pa-lg">
            <q-skeleton
              type="text"
              width="40%"
              class="q-mb-md"
            />
            <q-skeleton
              type="QInput"
              class="q-mb-lg"
            />
            <q-skeleton
              type="rect"
              height="200px"
            />
          </div>
        </div>

        <div v-else>
          <q-form
            v-if="isEditMode && (isNewPlan || canEditPlanData)"
            @submit="savePlan"
          >
            <!-- Template Selection (only for new plans) -->
            <q-card
              v-if="isNewPlan"
              flat
              bordered
              class="q-pa-lg q-mb-lg"
            >
              <div class="text-h6 q-mb-md">
                <q-icon
                  name="eva-file-text-outline"
                  class="q-mr-sm"
                />
                Select Template
              </div>

              <PlanTemplateSelector
                v-model="selectedTemplate"
                @template-selected="onTemplateSelected"
              />
            </q-card>

            <!-- Plan Information -->
            <q-card
              flat
              bordered
              class="q-pa-lg q-mb-lg"
            >
              <div class="text-h6 q-mb-md">
                <q-icon
                  name="eva-info-outline"
                  class="q-mr-sm"
                />
                Plan Information
              </div>

              <q-input
                v-model="form.name"
                label="Plan Name"
                outlined
                :rules="[(val) => !!val || 'Plan name is required']"
                class="q-mb-md"
              />

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.startDate"
                    label="Start Date"
                    type="date"
                    outlined
                    :readonly="!canEditPlanStartDate"
                    :rules="[(val) => !!val || 'Start date is required']"
                    @update:model-value="updateEndDate"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.endDate"
                    label="End Date"
                    type="date"
                    outlined
                    readonly
                    :rules="[(val) => !!val || 'End date is required']"
                  />
                </div>
              </div>

              <div
                v-if="selectedTemplate"
                class="text-caption text-grey-6 q-mt-sm"
              >
                End date is automatically calculated based on template duration ({{
                  selectedTemplate.duration
                }})
              </div>
            </q-card>

            <!-- Plan Items -->
            <q-card
              flat
              bordered
              class="q-pa-lg q-mb-lg"
            >
              <div class="row items-center justify-between q-mb-md">
                <div class="text-h6">
                  <q-icon
                    name="eva-list-outline"
                    class="q-mr-sm"
                  />
                  Plan Items
                </div>
                <div class="text-h6 text-primary">
                  {{ formattedTotalAmount }}
                </div>
              </div>

              <div v-if="planCategoryGroups.length === 0">
                <q-banner class="bg-grey-1 text-grey-7">
                  <template #avatar>
                    <q-icon name="eva-info-outline" />
                  </template>
                  {{ isNewPlan ? 'Select a template to load plan items' : 'No items in this plan' }}
                </q-banner>
              </div>

              <div
                v-else
                class="column q-col-gutter-md"
              >
                <PlanCategory
                  v-for="group in planCategoryGroups"
                  :key="group.categoryId"
                  :category-id="group.categoryId"
                  :category-name="getCategoryName(group.categoryId)"
                  :category-color="group.categoryColor"
                  :items="group.items"
                  :currency="planCurrency"
                  @update-item="handleUpdateItem"
                  @remove-item="handleRemoveItem"
                  @add-item="handleAddItem"
                />
              </div>

              <div
                v-if="!isValidForSave && planItems.length > 0"
                class="q-mt-md"
              >
                <q-banner class="bg-red-1 text-red-8">
                  <template #avatar>
                    <q-icon name="eva-alert-triangle-outline" />
                  </template>
                  <div v-if="hasDuplicateItems">
                    You have duplicate item names within the same category. Please use unique names.
                  </div>
                  <div v-else>Please ensure all items have a name, category, and valid amount.</div>
                </q-banner>
              </div>
            </q-card>

            <!-- Action Buttons -->
            <div class="row justify-end q-col-gutter-md">
              <div class="col-auto">
                <q-btn
                  flat
                  label="Cancel"
                  @click="goBack"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  v-if="!isNewPlan && currentPlan && getPlanStatus(currentPlan) === 'active'"
                  color="negative"
                  outline
                  label="Cancel Plan"
                  icon="eva-close-circle-outline"
                  class="q-mr-sm"
                  @click="confirmCancelPlan"
                />
                <q-btn
                  color="primary"
                  type="submit"
                  :label="isNewPlan ? 'Create Plan' : 'Save Changes'"
                  :loading="plansStore.isLoading"
                  :disable="!isValidForSave || !selectedTemplate"
                  unelevated
                />
              </div>
            </div>
          </q-form>

          <!-- Read-only view -->
          <div v-else>
            <q-card
              flat
              bordered
              class="q-pa-lg q-mb-lg"
            >
              <div class="text-h6 q-mb-md">
                <q-icon
                  name="eva-info-outline"
                  class="q-mr-sm"
                />
                Plan Information
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-6">Plan Name</div>
                  <div class="text-body1">{{ form.name }}</div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-6">Status</div>
                  <q-chip
                    v-if="currentPlan"
                    :color="getStatusColor(currentPlan)"
                    :icon="getStatusIcon(currentPlan)"
                    text-color="white"
                    class="q-mt-xs"
                  >
                    {{ getStatusText(currentPlan) }}
                  </q-chip>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-6">Date Range</div>
                  <div class="text-body1">{{ formatDateRange(form.startDate, form.endDate) }}</div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-6">Total Amount</div>
                  <div class="text-body1 text-primary text-weight-bold">
                    {{ formattedTotalAmount }}
                  </div>
                </div>
              </div>
            </q-card>

            <!-- Read-only items -->
            <q-card
              flat
              bordered
              class="q-pa-lg"
            >
              <div class="text-h6 q-mb-md">
                <q-icon
                  name="eva-list-outline"
                  class="q-mr-sm"
                />
                Plan Items
              </div>

              <div
                v-if="planCategoryGroups.length === 0"
                class="text-center text-grey-6 q-py-lg"
              >
                No items in this plan
              </div>

              <div
                v-else
                class="column q-col-gutter-md"
              >
                <PlanCategory
                  v-for="group in planCategoryGroups"
                  :key="group.categoryId"
                  :category-id="group.categoryId"
                  :category-name="getCategoryName(group.categoryId)"
                  :category-color="group.categoryColor"
                  :items="group.items"
                  :currency="planCurrency"
                  readonly
                />
              </div>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Dialog -->
    <SharePlanDialog
      v-if="currentPlan"
      v-model="isShareDialogOpen"
      :plan-id="currentPlan.id"
      @shared="onPlanShared"
    />

    <!-- Cancel Plan Dialog -->
    <q-dialog
      v-model="showCancelDialog"
      persistent
    >
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Cancel Plan</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-banner class="bg-red-1 text-red-8 q-mb-md">
            <template #avatar>
              <q-icon name="eva-alert-triangle-outline" />
            </template>
            This will cancel your active plan and cannot be undone.
          </q-banner>
          Are you sure you want to cancel this plan?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Keep Plan"
            @click="showCancelDialog = false"
          />
          <q-btn
            color="negative"
            label="Cancel Plan"
            @click="cancelPlan"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import PlanTemplateSelector from 'src/components/plans/PlanTemplateSelector.vue'
import PlanCategory from 'src/components/plans/PlanCategory.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import { usePlansStore } from 'src/stores/plans'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { usePlan } from 'src/composables/usePlan'
import { usePlanItems } from 'src/composables/usePlanItems'
import { formatCurrency } from 'src/utils/currency'
import {
  calculateEndDate,
  getPlanStatus,
  getStatusText,
  getStatusColor,
  getStatusIcon,
  formatDateRange,
} from 'src/utils/plans'
import type { ExpenseTemplateWithItems } from 'src/api'
import type { PlanItemUI } from 'src/types'

const router = useRouter()
const plansStore = usePlansStore()
const categoriesStore = useCategoriesStore()
const notificationsStore = useNotificationStore()

const {
  currentPlan,
  isPlanLoading,
  isNewPlan,
  isOwner,
  isReadOnlyMode,
  isEditMode,
  canEditPlanData,
  canEditPlanStartDate,
  planCurrency,
  createNewPlanWithItems,
  updateExistingPlanWithItems,
  loadPlan,
  cancelCurrentPlan,
} = usePlan()

const {
  planItems,
  totalAmount,
  hasDuplicateItems,
  isValidForSave,
  planCategoryGroups,
  addPlanItem,
  updatePlanItem,
  removePlanItem,
  loadPlanItems,
  loadPlanItemsFromTemplate,
  getPlanItemsForSave,
} = usePlanItems()

const selectedTemplate = ref<ExpenseTemplateWithItems | null>(null)
const isShareDialogOpen = ref(false)
const showCancelDialog = ref(false)

const form = ref({
  name: '',
  startDate: '',
  endDate: '',
})

const currentPlanStatus = computed(() => {
  if (!currentPlan.value) return ''
  return getPlanStatus(currentPlan.value)
})

const formattedTotalAmount = computed(() => formatCurrency(totalAmount.value, planCurrency.value))

const pageTitle = computed(() => {
  if (isNewPlan.value) return 'Create Plan'
  if (isReadOnlyMode.value) return 'View Plan'
  return 'Edit Plan'
})

const pageIcon = computed(() => {
  if (isNewPlan.value) return 'eva-plus-circle-outline'
  if (isReadOnlyMode.value) return 'eva-eye-outline'
  return 'eva-edit-outline'
})

const breadcrumbLabel = computed(() => {
  if (isNewPlan.value) return 'New Plan'
  return currentPlan.value?.name || 'Plan'
})

const breadcrumbIcon = computed(() => {
  if (isNewPlan.value) return 'eva-plus-outline'
  return 'eva-calendar-outline'
})

function getCategoryName(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.name || 'Unknown Category'
}

function onTemplateSelected(template: ExpenseTemplateWithItems): void {
  selectedTemplate.value = template
  form.value.name = `${template.name} Plan`

  // Load template items into plan items
  loadPlanItemsFromTemplate(template.expense_template_items)

  // Set default start date to today if not set
  if (!form.value.startDate) {
    form.value.startDate = new Date().toISOString().split('T')[0] || ''
    updateEndDate()
  }
}

function updateEndDate(): void {
  if (form.value.startDate && selectedTemplate.value) {
    const startDate = new Date(form.value.startDate)
    const endDate = calculateEndDate(
      startDate,
      selectedTemplate.value.duration as 'weekly' | 'monthly' | 'yearly',
    )
    form.value.endDate = endDate?.toISOString().split('T')[0] || ''
  }
}

function handleUpdateItem(itemId: string, updatedItem: PlanItemUI): void {
  updatePlanItem(itemId, updatedItem)
}

function handleRemoveItem(itemId: string): void {
  removePlanItem(itemId)
}

function handleAddItem(categoryId: string, categoryColor: string): void {
  addPlanItem(categoryId, categoryColor)
}

async function savePlan(): Promise<void> {
  if (!isValidForSave.value || !selectedTemplate.value) return

  const planItemsForSave = getPlanItemsForSave()
  const success = isNewPlan.value
    ? await createNewPlanWithItems(
        selectedTemplate.value.id,
        form.value.name,
        form.value.startDate,
        form.value.endDate,
        'pending', // New plans start as pending
        totalAmount.value,
        planItemsForSave,
      )
    : await updateExistingPlanWithItems(
        form.value.name,
        form.value.startDate,
        form.value.endDate,
        currentPlan.value?.status || 'pending',
        totalAmount.value,
        planItemsForSave,
      )

  if (success) {
    notificationsStore.showSuccess(
      isNewPlan.value ? 'Plan created successfully' : 'Plan updated successfully',
    )
    goBack()
  }
}

function confirmCancelPlan(): void {
  showCancelDialog.value = true
}

async function cancelPlan(): Promise<void> {
  await cancelCurrentPlan()
  showCancelDialog.value = false
  notificationsStore.showSuccess('Plan cancelled successfully')
  goBack()
}

function openShareDialog(): void {
  isShareDialogOpen.value = true
}

function onPlanShared(): void {
  notificationsStore.showSuccess('Plan shared successfully')
}

function goBack(): void {
  router.push({ name: 'plans' })
}

onMounted(async () => {
  await categoriesStore.loadCategories()

  if (!isNewPlan.value) {
    const plan = await loadPlan()
    if (plan) {
      form.value.name = plan.name
      form.value.startDate = plan.start_date
      form.value.endDate = plan.end_date
      loadPlanItems(plan)
    }
  }
})
</script>
