<template>
  <DetailPageLayout
    :page-title="pageTitle"
    :page-icon="pageIcon"
    :banners="banners"
    :is-loading="isPlanLoading"
    :actions="actionBarActions"
    :actions-visible="actionsVisible"
    @back="goBack"
  >
    <!-- For new plans, show the creation form directly without tabs -->
    <q-form
      v-if="isNewPlan"
      ref="planForm"
      @submit="handleSavePlan"
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

        <div class="text-body2 text-grey-6 q-mb-md">
          Select a template to base your plan on. You can modify the items and amounts after
          selection.
        </div>

        <q-select
          v-model="selectedTemplateOption"
          :options="templateOptions"
          option-label="name"
          option-value="id"
          label="Choose Template"
          outlined
          emit-value
          map-options
          :loading="templatesStore.isLoading"
          :error="templateError"
          :error-message="templateErrorMessage"
          @update:model-value="onTemplateSelected"
        >
          <template #option="scope">
            <q-item
              v-bind="scope.itemProps"
              class="q-pa-md"
            >
              <q-item-section>
                <div class="row items-center justify-between">
                  <div class="row">
                    <div class="text-weight-medium">{{ scope.opt.name }}</div>
                    <q-badge
                      color="primary"
                      text-color="white"
                      class="q-px-sm q-py-xs q-ml-sm"
                    >
                      <q-icon
                        name="eva-clock-outline"
                        size="12px"
                        class="q-mr-xs"
                      />
                      {{ scope.opt.duration }}
                    </q-badge>
                  </div>
                  <div class="col-auto row items-center q-gutter-sm">
                    <div class="text-weight-bold text-primary">
                      {{ formatCurrency(scope.opt.total, scope.opt.currency) }}
                    </div>
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey"> No templates available </q-item-section>
            </q-item>
          </template>
        </q-select>

        <div
          v-if="selectedTemplate"
          class="q-mt-lg"
        >
          <div class="text-body2 text-grey-6 q-mb-sm">Selected Template:</div>
          <TemplateCard
            :template="selectedTemplate"
            readonly
            @edit="() => {}"
            @share="() => {}"
            @delete="() => {}"
          />
        </div>
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
              outlined
              :rules="startDateRules"
              @update:model-value="updateEndDate"
            >
              <template #append>
                <q-icon
                  name="eva-calendar-outline"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date
                      v-model="form.startDate"
                      mask="YYYY-MM-DD"
                      @update:model-value="onStartDateChange"
                    >
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          label="Close"
                          color="primary"
                          flat
                        />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.endDate"
              label="End Date"
              outlined
              readonly
              :rules="[(val) => !!val || 'End date is required']"
              hint="Calculated automatically based on template duration"
            />
          </div>
        </div>

        <div
          v-if="selectedTemplate"
          class="text-caption text-grey-6 q-mt-sm"
        >
          Template duration: {{ selectedTemplate.duration }}
        </div>
      </q-card>

      <!-- Plan Items -->
      <q-card
        flat
        bordered
        class="q-pa-lg q-mb-lg"
      >
        <div class="row items-center justify-between q-mb-lg">
          <div class="text-h6">
            <q-icon
              name="eva-list-outline"
              class="q-mr-sm"
            />
            Plan Items
          </div>
          <q-btn
            v-if="planCategoryGroups.length > 1"
            flat
            :icon="allCategoriesExpanded ? 'eva-collapse-outline' : 'eva-expand-outline'"
            :label="allCategoriesExpanded ? 'Collapse All' : 'Expand All'"
            color="primary"
            @click="toggleAllCategories"
          />
        </div>

        <div v-if="planCategoryGroups.length === 0">
          <q-banner class="bg-grey-1 text-grey-7">
            <template #avatar>
              <q-icon name="eva-info-outline" />
            </template>
            {{ isNewPlan ? 'Select a template to load plan items' : 'No items in this plan' }}
          </q-banner>
        </div>

        <div v-else>
          <PlanCategory
            v-for="group in planCategoryGroups"
            :key="group.categoryId"
            :category-id="group.categoryId"
            :category-name="getCategoryName(group.categoryId)"
            :category-color="group.categoryColor"
            :category-icon="getCategoryIcon(group.categoryId)"
            :items="group.items"
            :currency="planCurrency"
            :default-expanded="allCategoriesExpanded"
            @update-item="handleUpdateItem"
            @remove-item="handleRemoveItem"
            @add-item="handleAddItem"
          />
        </div>

        <div v-if="planCategoryGroups.length > 0">
          <q-separator class="q-mb-lg" />
          <div class="row items-center justify-between">
            <div
              class="text-h6"
              style="display: flex; align-items: center"
            >
              <q-icon
                name="eva-credit-card-outline"
                class="q-mr-sm"
              />
              Total Amount
            </div>
            <div
              :class="['text-primary text-weight-bold', $q.screen.lt.md ? 'text-h5' : 'text-h4']"
            >
              {{ formattedTotalAmount }}
            </div>
          </div>
          <div class="text-body2 text-grey-6">
            Total across {{ planCategoryGroups.length }}
            {{ planCategoryGroups.length === 1 ? 'category' : 'categories' }}
          </div>
        </div>

        <div
          v-if="hasDuplicateItems && planItems.length > 0"
          class="q-mt-md"
        >
          <q-banner class="bg-red-1 text-red-8">
            <template #avatar>
              <q-icon name="eva-alert-triangle-outline" />
            </template>
            <div>
              You have duplicate item names within the same category. Please use unique names.
            </div>
          </q-banner>
        </div>
      </q-card>
    </q-form>

    <!-- For existing plans, show tabs for Overview and Edit modes -->
    <div v-else-if="!isNewPlan">
      <q-tabs
        v-model="activeTab"
        dense
        no-caps
        align="justify"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab
          name="overview"
          label="Overview"
          icon="eva-pie-chart-outline"
        />
        <q-tab
          v-if="isEditMode"
          name="edit"
          label="Edit Plan"
          icon="eva-edit-outline"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="activeTab"
        animated
        transition-prev="fade"
        transition-next="fade"
        class="q-mt-md"
      >
        <!-- Overview Tab -->
        <q-tab-panel name="overview">
          <PlanOverviewTab
            :plan="currentPlan"
            :is-owner="isOwner"
            :is-edit-mode="isEditMode"
            @refresh="refreshPlanData"
            @open-expense-dialog="
              (categoryId?: string) => openExpenseRegistrationFromCategory(categoryId)
            "
          />
        </q-tab-panel>

        <!-- Edit Tab -->
        <q-tab-panel
          v-if="isEditMode"
          name="edit"
        >
          <q-form
            ref="planEditForm"
            @submit="handleSavePlan"
          >
            <!-- Plan Information for editing existing plan -->
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
                    outlined
                    :rules="startDateRules"
                    @update:model-value="updateEndDate"
                  >
                    <template #append>
                      <q-icon
                        name="eva-calendar-outline"
                        class="cursor-pointer"
                      >
                        <q-popup-proxy
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            v-model="form.startDate"
                            mask="YYYY-MM-DD"
                            @update:model-value="onStartDateChange"
                          >
                            <div class="row items-center justify-end">
                              <q-btn
                                v-close-popup
                                label="Close"
                                color="primary"
                                flat
                              />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.endDate"
                    label="End Date"
                    outlined
                    readonly
                    :rules="[(val) => !!val || 'End date is required']"
                    hint="Calculated automatically based on template duration"
                  />
                </div>
              </div>
            </q-card>

            <!-- Plan Items for editing existing plan -->
            <q-card
              flat
              bordered
              class="q-pa-lg"
            >
              <div class="row items-center justify-between q-mb-lg">
                <div class="text-h6">
                  <q-icon
                    name="eva-list-outline"
                    class="q-mr-sm"
                  />
                  Plan Items
                </div>
                <q-btn
                  v-if="planCategoryGroups.length > 1"
                  flat
                  :icon="allCategoriesExpanded ? 'eva-collapse-outline' : 'eva-expand-outline'"
                  :label="allCategoriesExpanded ? 'Collapse All' : 'Expand All'"
                  color="primary"
                  @click="toggleAllCategories"
                />
              </div>

              <div v-if="planCategoryGroups.length === 0">
                <q-banner class="bg-grey-1 text-grey-7">
                  <template #avatar>
                    <q-icon name="eva-info-outline" />
                  </template>
                  No items in this plan
                </q-banner>
              </div>

              <div v-else>
                <PlanCategory
                  v-for="group in planCategoryGroups"
                  :key="group.categoryId"
                  :category-id="group.categoryId"
                  :category-name="getCategoryName(group.categoryId)"
                  :category-color="group.categoryColor"
                  :category-icon="getCategoryIcon(group.categoryId)"
                  :items="group.items"
                  :currency="planCurrency"
                  :default-expanded="allCategoriesExpanded"
                  @update-item="handleUpdateItem"
                  @remove-item="handleRemoveItem"
                  @add-item="handleAddItem"
                />
              </div>

              <div v-if="planCategoryGroups.length > 0">
                <q-separator class="q-mb-lg" />
                <div class="row items-center justify-between">
                  <div
                    class="text-h6"
                    style="display: flex; align-items: center"
                  >
                    <q-icon
                      name="eva-credit-card-outline"
                      class="q-mr-sm"
                    />
                    Total Amount
                  </div>
                  <div
                    :class="[
                      'text-primary text-weight-bold',
                      $q.screen.lt.md ? 'text-h5' : 'text-h4',
                    ]"
                  >
                    {{ formattedTotalAmount }}
                  </div>
                </div>
                <div class="text-body2 text-grey-6">
                  Total across {{ planCategoryGroups.length }}
                  {{ planCategoryGroups.length === 1 ? 'category' : 'categories' }}
                </div>
              </div>

              <div
                v-if="hasDuplicateItems && planItems.length > 0"
                class="q-mt-md"
              >
                <q-banner class="bg-red-1 text-red-8">
                  <template #avatar>
                    <q-icon name="eva-alert-triangle-outline" />
                  </template>
                  <div>
                    You have duplicate item names within the same category. Please use unique names.
                  </div>
                </q-banner>
              </div>
            </q-card>
          </q-form>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Legacy read-only view (for backward compatibility) -->
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
        <div class="text-h6 q-mb-lg">
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

        <div v-else>
          <PlanCategory
            v-for="group in planCategoryGroups"
            :key="group.categoryId"
            :category-id="group.categoryId"
            :category-name="getCategoryName(group.categoryId)"
            :category-color="group.categoryColor"
            :category-icon="getCategoryIcon(group.categoryId)"
            :items="group.items"
            :currency="planCurrency"
            readonly
          />
        </div>
      </q-card>
    </div>

    <!-- Dialogs Slot -->
    <template #dialogs>
      <SharePlanDialog
        v-if="currentPlan"
        v-model="isShareDialogOpen"
        :plan-id="currentPlan.id"
        @shared="onPlanShared"
      />

      <!-- Cancel Plan Dialog -->
      <DeleteDialog
        v-model="showCancelDialog"
        title="Cancel Plan"
        warning-message="This will mark the plan as cancelled and stop any active tracking."
        :confirmation-message="`Are you sure you want to cancel &quot;${form.name}&quot;?`"
        cancel-label="Keep Active"
        confirm-label="Cancel Plan"
        @confirm="cancelPlan"
      />

      <!-- Delete Plan Dialog -->
      <DeleteDialog
        v-model="showDeleteDialog"
        title="Delete Plan"
        warning-message="This will permanently delete your plan and all its data. This action cannot be undone."
        :confirmation-message="`Are you sure you want to delete this plan?`"
        cancel-label="Keep Plan"
        confirm-label="Delete Plan"
        :is-deleting="plansStore.isLoading"
        @confirm="deletePlan"
      />

      <!-- Expense Registration Dialog -->
      <ExpenseRegistrationDialog
        v-if="currentPlan && !isNewPlan"
        v-model="showExpenseDialog"
        :default-plan-id="currentPlan.id"
        :default-category-id="selectedCategory?.categoryId || null"
        @expense-created="refreshPlanData"
      />
    </template>
  </DetailPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { QForm } from 'quasar'

import DetailPageLayout from 'src/layouts/DetailPageLayout.vue'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'
import PlanCategory from 'src/components/plans/PlanCategory.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import TemplateCard from 'src/components/templates/TemplateCard.vue'
import DeleteDialog from 'src/components/shared/DeleteDialog.vue'
import PlanOverviewTab from 'src/components/plans/PlanOverviewTab.vue'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { usePlansStore } from 'src/stores/plans'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import { useTemplatesStore } from 'src/stores/templates'
import { usePlan } from 'src/composables/usePlan'
import { usePlanItems } from 'src/composables/usePlanItems'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import { formatCurrency } from 'src/utils/currency'
import {
  calculateEndDate,
  getPlanStatus,
  getStatusText,
  getStatusColor,
  getStatusIcon,
  formatDateRange,
} from 'src/utils/plans'
import type { TemplateWithItems } from 'src/api'
import type { PlanItemUI } from 'src/types'

const router = useRouter()
const plansStore = usePlansStore()
const categoriesStore = useCategoriesStore()
const notificationsStore = useNotificationStore()
const templatesStore = useTemplatesStore()

// Plan composables
const {
  currentPlan,
  isPlanLoading,
  isNewPlan,
  isOwner,
  isReadOnlyMode,
  isEditMode,
  canEditPlanData,
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

// Page state configuration
const pageConfig = {
  entityName: 'Plan',
  entityNamePlural: 'Plans',
  listRoute: '/plans',
  listIcon: 'eva-calendar-outline',
  createIcon: 'eva-plus-circle-outline',
  editIcon: 'eva-edit-outline',
  viewIcon: 'eva-eye-outline',
}

const { pageTitle, pageIcon } = useDetailPageState(
  pageConfig,
  isNewPlan.value,
  isReadOnlyMode.value,
)

// Custom banners with plan-specific logic
const banners = computed(() => {
  const bannersList = []

  if (isReadOnlyMode.value) {
    bannersList.push({
      type: 'readonly',
      class: 'bg-orange-1 text-orange-8',
      icon: 'eva-eye-outline',
      message: `You're viewing this ${pageConfig.entityName.toLowerCase()} in read-only mode. Contact the owner for edit access.`,
    })
  }

  if (!isNewPlan.value && !canEditPlanData.value && isOwner.value) {
    bannersList.push({
      type: 'locked',
      class: 'bg-grey-2 text-grey-8',
      icon: 'eva-lock-outline',
      message: `This plan cannot be edited because it's ${currentPlanStatus.value} or completed.`,
    })
  }

  return bannersList
})

const { openDialog, closeDialog, getDialogState } = useEditablePage()

// Local state
const planForm = ref()
const planEditForm = ref()
const selectedTemplate = ref<TemplateWithItems | null>(null)
const selectedTemplateOption = ref<string | null>(null)
const allCategoriesExpanded = ref(false)
const showCancelDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedCategory = ref<{ categoryId: string } | null>(null)
const activeTab = ref('overview')
const showExpenseDialog = ref(false)

const form = ref({
  name: '',
  startDate: '',
  endDate: '',
})

// Error states for validation
const templateError = ref(false)
const templateErrorMessage = ref('')

// Computed properties
const currentPlanStatus = computed(() => {
  if (!currentPlan.value) return ''
  return getPlanStatus(currentPlan.value)
})

const formattedTotalAmount = computed(() => formatCurrency(totalAmount.value, planCurrency.value))

const templateOptions = computed(() => {
  return templatesStore.templates.map((template) => ({
    id: template.id,
    name: template.name,
    duration: template.duration,
    total: template.total,
    currency: template.currency,
    permission_level: template.permission_level,
  }))
})

const startDateRules = computed(() => [
  (val: string) => !!val || 'Start date is required',
  (val: string) => {
    if (!val) return true
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      return 'Date must be in YYYY-MM-DD format'
    }
    const date = new Date(val)
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date'
    }
    if (date.toISOString().split('T')[0] !== val) {
      return 'Please enter a valid date'
    }
    return true
  },
])

// Dialog states
const isShareDialogOpen = computed({
  get: () => getDialogState('share'),
  set: (value: boolean) => (value ? openDialog('share') : closeDialog('share')),
})

// Action Bar Actions for edit mode and new plans
const editActions = computed<ActionBarAction[]>(() => [
  {
    key: 'save',
    icon: 'eva-save-outline',
    label: 'Save',
    color: 'positive',
    priority: 'primary',
    handler: handleSavePlan,
  },
  {
    key: 'share',
    icon: 'eva-share-outline',
    label: 'Share',
    color: 'info',
    priority: 'secondary',
    visible: !isNewPlan.value && isOwner.value,
    handler: () => openDialog('share'),
  },
  {
    key: 'cancel',
    icon: 'eva-close-circle-outline',
    label: 'Cancel',
    color: 'negative',
    priority: 'secondary',
    visible:
      !isNewPlan.value &&
      !!currentPlan.value &&
      getPlanStatus(currentPlan.value) === 'active' &&
      isOwner.value,
    handler: () => {
      showCancelDialog.value = true
    },
  },
  {
    key: 'delete',
    icon: 'eva-trash-2-outline',
    label: 'Delete',
    color: 'negative',
    priority: 'secondary',
    visible:
      !isNewPlan.value &&
      !!currentPlan.value &&
      (getPlanStatus(currentPlan.value) === 'pending' ||
        getPlanStatus(currentPlan.value) === 'completed' ||
        getPlanStatus(currentPlan.value) === 'cancelled') &&
      isOwner.value,
    handler: () => {
      showDeleteDialog.value = true
    },
  },
])

// Action Bar Actions for overview tab
const overviewActions = computed<ActionBarAction[]>(() => [
  {
    key: 'add-expense',
    icon: 'eva-plus-circle-outline',
    label: 'Add Expense',
    color: 'primary',
    priority: 'primary',
    visible: isEditMode.value,
    handler: openExpenseRegistration,
  },
  {
    key: 'edit',
    icon: 'eva-edit-outline',
    label: 'Edit',
    color: 'info',
    priority: 'primary',
    visible: isEditMode.value && canEditPlanData.value,
    handler: () => {
      activeTab.value = 'edit'
    },
  },
  {
    key: 'share',
    icon: 'eva-share-outline',
    label: 'Share',
    color: 'info',
    priority: 'secondary',
    visible: isOwner.value,
    handler: () => openDialog('share'),
  },
])

// Current Action Bar actions based on context
const actionBarActions = computed<ActionBarAction[]>(() => {
  if (isNewPlan.value) {
    return editActions.value
  }
  if (activeTab.value === 'overview') {
    return overviewActions.value
  }
  return editActions.value
})

// Actions visibility based on context
const actionsVisible = computed(() => {
  return (
    (isEditMode.value && (isNewPlan.value || canEditPlanData.value)) ||
    (!isNewPlan.value && activeTab.value === 'overview')
  )
})

// Component methods
function getCategoryName(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.name || 'Unknown Category'
}

function getCategoryIcon(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.icon ?? ''
}

async function onTemplateSelected(templateId: string | null): Promise<void> {
  // Clear template error when a selection is made
  clearTemplateError()

  if (!templateId) {
    selectedTemplate.value = null
    selectedTemplateOption.value = null
    return
  }

  const template = await templatesStore.loadTemplateWithItems(templateId)

  if (template) {
    selectedTemplate.value = template
    selectedTemplateOption.value = templateId
    form.value.name = `${template.name} Plan`

    loadPlanItemsFromTemplate(template.template_items)

    if (!form.value.startDate) {
      form.value.startDate = new Date().toISOString().split('T')[0] || ''
      updateEndDate()
    }
  }
}

function updateEndDate(): void {
  if (!form.value.startDate) return

  let templateDuration: string | null = null

  if (isNewPlan.value && selectedTemplate.value) {
    templateDuration = selectedTemplate.value.duration
  } else if (!isNewPlan.value && currentPlan.value?.template_id) {
    const template = templatesStore.templates.find((t) => t.id === currentPlan.value?.template_id)
    templateDuration = template?.duration || null
  }

  if (templateDuration) {
    const startDate = new Date(form.value.startDate)
    if (!isNaN(startDate.getTime())) {
      const endDate = calculateEndDate(
        startDate,
        templateDuration as 'weekly' | 'monthly' | 'yearly',
      )
      form.value.endDate = endDate?.toISOString().split('T')[0] || ''
    } else {
      form.value.endDate = ''
    }
  }
}

function onStartDateChange(newDate: string): void {
  form.value.startDate = newDate
  updateEndDate()
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

async function handleSavePlan(): Promise<void> {
  clearTemplateError()

  if (isNewPlan.value && !selectedTemplate.value) {
    templateError.value = true
    templateErrorMessage.value = 'Please select a template'
    notificationsStore.showError('Please select a template before creating the plan')
    return
  }

  // Use the appropriate form ref based on context
  const formRef = isNewPlan.value ? planForm.value : planEditForm.value
  if (formRef) {
    const isFormValid = await formRef.validate()
    if (!isFormValid) {
      notificationsStore.showError('Please fix the form errors before saving')
      return
    }
  }

  if (!isValidForSave.value && hasDuplicateItems.value) {
    notificationsStore.showError(
      'You have duplicate item names within the same category. Please use unique names.',
    )
    return
  }

  await savePlan()
}

async function savePlan(): Promise<void> {
  const planItemsForSave = getPlanItemsForSave()
  const success = isNewPlan.value
    ? await createNewPlanWithItems(
        selectedTemplate.value!.id,
        form.value.name,
        form.value.startDate,
        form.value.endDate,
        totalAmount.value,
        planItemsForSave,
      )
    : await updateExistingPlanWithItems(
        form.value.name,
        form.value.startDate,
        form.value.endDate,
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

async function cancelPlan(): Promise<void> {
  await cancelCurrentPlan()
  showCancelDialog.value = false
  notificationsStore.showSuccess('Plan cancelled successfully')
  goBack()
}

async function deletePlan(): Promise<void> {
  if (!currentPlan.value) return

  await plansStore.removePlan(currentPlan.value.id)
  showDeleteDialog.value = false
  notificationsStore.showSuccess('Plan deleted successfully')
  goBack()
}

function onPlanShared(): void {
  notificationsStore.showSuccess('Plan shared successfully')
  closeDialog('share')
}

function toggleAllCategories(): void {
  allCategoriesExpanded.value = !allCategoriesExpanded.value
}

function goBack(): void {
  router.push({ name: 'plans' })
}

function clearTemplateError(): void {
  templateError.value = false
  templateErrorMessage.value = ''
}

function openExpenseRegistration(): void {
  selectedCategory.value = null
  showExpenseDialog.value = true
}

function openExpenseRegistrationFromCategory(categoryId?: string): void {
  selectedCategory.value = categoryId ? { categoryId } : null
  showExpenseDialog.value = true
}

async function refreshPlanData(): Promise<void> {
  if (!isNewPlan.value && currentPlan.value) {
    const plan = await loadPlan()
    if (plan) {
      form.value.name = plan.name
      form.value.startDate = plan.start_date
      form.value.endDate = plan.end_date
      loadPlanItems(plan)
    }
  }
}

onMounted(async () => {
  if (!isNewPlan.value) {
    isPlanLoading.value = true
  }

  try {
    await Promise.all([categoriesStore.loadCategories(), templatesStore.loadTemplates()])

    if (!isNewPlan.value) {
      const plan = await loadPlan()
      if (plan) {
        form.value.name = plan.name
        form.value.startDate = plan.start_date
        form.value.endDate = plan.end_date
        loadPlanItems(plan)
      }
    }
  } finally {
    if (!isNewPlan.value) {
      isPlanLoading.value = false
    }
  }
})
</script>
