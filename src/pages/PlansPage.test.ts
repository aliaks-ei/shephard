import { mount } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref, computed } from 'vue'
import PlansPage from './PlansPage.vue'
import { usePlansStore } from 'src/stores/plans'
import { useNotificationStore } from 'src/stores/notification'
import { usePlans } from 'src/composables/usePlans'
import type { PlanWithPermission } from 'src/api'

installQuasarPlugin()

vi.mock('src/composables/usePlans')

const PlansGroupStub = {
  template: `
    <div
      class="plans-group-mock"
      :data-title="title"
      :data-plans-count="plans ? plans.length : 0"
      :data-chip-color="chipColor"
      :data-hide-shared-badge="hideSharedBadge"
    >
      <div v-for="plan in plans" :key="plan.id" class="plan-item">
        <button @click="$emit('edit', plan.id)" class="edit-btn">Edit</button>
        <button @click="$emit('delete', plan)" class="delete-btn">Delete</button>
        <button @click="$emit('share', plan.id)" class="share-btn">Share</button>
        <button @click="$emit('cancel', plan)" class="cancel-btn">Cancel</button>
      </div>
    </div>
  `,
  props: ['title', 'plans', 'chipColor', 'hideSharedBadge'],
  emits: ['edit', 'delete', 'share', 'cancel'],
}

const SharePlanDialogStub = {
  template: `
    <div
      class="share-dialog-mock"
      :data-model-value="modelValue"
      :data-plan-id="planId"
    >
      <button @click="$emit('shared')" class="share-confirm-btn">Share</button>
    </div>
  `,
  props: ['modelValue', 'planId'],
  emits: ['update:modelValue', 'shared'],
}

const SearchAndSortStub = {
  template: `
    <div class="search-and-sort-mock">
      <input
        class="search-input"
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
        :placeholder="searchPlaceholder"
      />
      <select
        class="sort-select"
        :value="sortBy"
        @change="$emit('update:sortBy', $event.target.value)"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  `,
  props: ['searchQuery', 'sortBy', 'searchPlaceholder', 'sortOptions'],
  emits: ['update:searchQuery', 'update:sortBy'],
}

const ListPageSkeletonStub = {
  template: '<div class="list-page-skeleton-mock"></div>',
}

const EmptyStateStub = {
  template: `
    <div class="empty-state-mock" :data-has-search-query="hasSearchQuery">
      <div class="empty-state-content">
        <i v-if="hasSearchQuery" :data-name="searchIcon"></i>
        <i v-else :data-name="emptyIcon"></i>
        <h3>{{ hasSearchQuery ? searchTitle : emptyTitle }}</h3>
        <p>{{ hasSearchQuery ? searchDescription : emptyDescription }}</p>
        <button v-if="hasSearchQuery" @click="$emit('clear-search')" class="clear-search-btn">
          Clear Search
        </button>
        <button v-else @click="$emit('create')" class="create-btn">
          {{ createButtonLabel }}
        </button>
      </div>
    </div>
  `,
  props: [
    'hasSearchQuery',
    'searchIcon',
    'emptyIcon',
    'searchTitle',
    'emptyTitle',
    'searchDescription',
    'emptyDescription',
    'createButtonLabel',
  ],
  emits: ['clear-search', 'create'],
}

const mockOwnedPlans: PlanWithPermission[] = [
  {
    id: 'plan-1',
    name: 'Monthly Budget',
    template_id: 'template-1',
    start_date: '2023-06-01',
    end_date: '2023-06-30',
    status: 'active',
    total: 1500,
    currency: 'USD',
    owner_id: 'user-1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    permission_level: 'owner',
  },
  {
    id: 'plan-2',
    name: 'Weekly Groceries',
    template_id: 'template-2',
    start_date: '2023-06-01',
    end_date: '2023-06-07',
    status: 'pending',
    total: 500,
    currency: 'USD',
    owner_id: 'user-1',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    permission_level: 'owner',
  },
]

const mockSharedPlans: PlanWithPermission[] = [
  {
    id: 'plan-3',
    name: 'Team Lunch',
    template_id: 'template-3',
    start_date: '2023-06-01',
    end_date: '2023-06-07',
    status: 'active',
    total: 800,
    currency: 'USD',
    owner_id: 'user-2',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
    permission_level: 'edit',
  },
]

function createWrapper(
  options: {
    ownedPlans?: PlanWithPermission[]
    sharedPlans?: PlanWithPermission[]
    isLoading?: boolean
    hasPlans?: boolean
    searchQuery?: string
    sortBy?: string
  } = {},
) {
  const {
    ownedPlans = [],
    sharedPlans = [],
    isLoading = false,
    hasPlans = false,
    searchQuery = '',
    sortBy = 'created_at',
  } = options

  const mockUsePlansReturn = {
    searchQuery: ref(searchQuery),
    sortBy: ref(sortBy),
    areItemsLoading: computed(() => isLoading),
    filteredAndSortedOwnedItems: computed(() => ownedPlans),
    filteredAndSortedSharedItems: computed(() => sharedPlans),
    allFilteredAndSortedItems: computed(() => [...ownedPlans, ...sharedPlans]),
    hasItems: computed(() => hasPlans),
    sortOptions: [
      { label: 'Name', value: 'name' },
      { label: 'Total Amount', value: 'total' },
      { label: 'Start Date', value: 'start_date' },
      { label: 'Created Date', value: 'created_at' },
    ],
    emptyStateConfig: computed(() => ({
      searchIcon: 'eva-search-outline',
      emptyIcon: 'eva-calendar-outline',
      searchTitle: 'No plans found',
      emptyTitle: 'No plans yet',
      searchDescription: 'Try adjusting your search terms or create a new plan',
      emptyDescription: 'Create your first plan to start tracking your financial goals',
      createLabel: 'Create Your First Plan',
    })),
    goToNew: vi.fn(),
    viewItem: vi.fn(),
    deleteItem: vi.fn(),
    clearSearch: vi.fn(),
  }

  vi.mocked(usePlans).mockReturnValue(mockUsePlansReturn)

  const wrapper = mount(PlansPage, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
      stubs: {
        PlansGroup: PlansGroupStub,
        SharePlanDialog: SharePlanDialogStub,
        SearchAndSort: SearchAndSortStub,
        ListPageSkeleton: ListPageSkeletonStub,
        EmptyState: EmptyStateStub,
        QBtn: {
          template: `
            <button
              class="q-btn"
              @click="$emit('click')"
              :data-color="color"
              :data-icon="icon"
              :data-label="label"
            >
              {{ label }}<slot />
            </button>
          `,
          props: ['color', 'icon', 'label', 'unelevated', 'flat'],
          emits: ['click'],
        },
        QCard: {
          template: '<div class="q-card" :class="$attrs.class"><slot /></div>',
          inheritAttrs: false,
        },
        QCardSection: {
          template: '<div class="q-card-section"><slot /></div>',
        },
        QIcon: {
          template: '<i class="q-icon" :data-name="name" :data-size="size"></i>',
          props: ['name', 'size'],
        },
      },
    },
  })

  return {
    wrapper,
    mockUsePlans: mockUsePlansReturn,
    plansStore: usePlansStore(),
    notificationStore: useNotificationStore(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const { wrapper } = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('should render page title and description', () => {
  const { wrapper } = createWrapper()

  expect(wrapper.text()).toContain('Plans')
  expect(wrapper.text()).toContain('Manage your financial plans and track your progress')
})

it('should render create plan button', () => {
  const { wrapper } = createWrapper()

  const createButton = wrapper.find('[data-label="Create Plan"]')
  expect(createButton.exists()).toBe(true)
})

it('should call goToNew when create button is clicked', async () => {
  const { wrapper, mockUsePlans } = createWrapper()

  const createButton = wrapper.find('[data-label="Create Plan"]')
  await createButton.trigger('click')

  expect(mockUsePlans.goToNew).toHaveBeenCalledOnce()
})

it('should render search and sort component', () => {
  const { wrapper } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  expect(searchAndSort.exists()).toBe(true)
  expect(searchAndSort.props('searchPlaceholder')).toBe('Search plans...')
})

it('should show loading skeleton when plans are loading', () => {
  const { wrapper } = createWrapper({ isLoading: true })

  const skeleton = wrapper.findComponent(ListPageSkeletonStub)
  expect(skeleton.exists()).toBe(true)

  const plansGroups = wrapper.findAll('.plans-group-mock')
  expect(plansGroups.length).toBe(0)
})

it('should show owned plans group when owned plans exist', () => {
  const { wrapper } = createWrapper({
    ownedPlans: mockOwnedPlans,
    hasPlans: true,
  })

  const ownedGroup = wrapper.find('[data-title="My Plans"]')
  expect(ownedGroup.exists()).toBe(true)
  expect(ownedGroup.attributes('data-plans-count')).toBe('2')
})

it('should show shared plans group when shared plans exist', () => {
  const { wrapper } = createWrapper({
    sharedPlans: mockSharedPlans,
    hasPlans: true,
  })

  const sharedGroup = wrapper.find('[data-title="Shared with Me"]')
  expect(sharedGroup.exists()).toBe(true)
  expect(sharedGroup.attributes('data-plans-count')).toBe('1')
  expect(sharedGroup.attributes('data-chip-color')).toBe('secondary')
  expect(sharedGroup.attributes('data-hide-shared-badge')).toBe('')
})

it('should show both plan groups when both exist', () => {
  const { wrapper } = createWrapper({
    ownedPlans: mockOwnedPlans,
    sharedPlans: mockSharedPlans,
    hasPlans: true,
  })

  const ownedGroup = wrapper.find('[data-title="My Plans"]')
  const sharedGroup = wrapper.find('[data-title="Shared with Me"]')

  expect(ownedGroup.exists()).toBe(true)
  expect(sharedGroup.exists()).toBe(true)
})

it('should show empty state when no plans and not loading', () => {
  const { wrapper } = createWrapper({
    isLoading: false,
    hasPlans: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.exists()).toBe(true)
  expect(emptyState.props('hasSearchQuery')).toBe(false)
  expect(emptyState.props('emptyTitle')).toBe('No plans yet')
  expect(emptyState.props('emptyDescription')).toBe(
    'Create your first plan to start tracking your financial goals',
  )
})

it('should show search empty state when searching with no results', () => {
  const { wrapper } = createWrapper({
    searchQuery: 'nonexistent',
    hasPlans: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.exists()).toBe(true)
  expect(emptyState.props('hasSearchQuery')).toBe(true)
  expect(emptyState.props('searchTitle')).toBe('No plans found')
  expect(emptyState.props('searchDescription')).toBe(
    'Try adjusting your search terms or create a new plan',
  )
})

it('should clear search when clear search button is clicked', async () => {
  const { wrapper, mockUsePlans } = createWrapper({
    searchQuery: 'test',
    hasPlans: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  await emptyState.vm.$emit('clear-search')

  expect(mockUsePlans.clearSearch).toHaveBeenCalledOnce()
})

it('should call viewItem when edit button is clicked', async () => {
  const { wrapper, mockUsePlans } = createWrapper({
    ownedPlans: mockOwnedPlans,
    hasPlans: true,
  })

  const editButton = wrapper.find('.edit-btn')
  await editButton.trigger('click')

  expect(mockUsePlans.viewItem).toHaveBeenCalledWith('plan-1')
})

it('should call deleteItem when delete button is clicked', async () => {
  const { wrapper, mockUsePlans } = createWrapper({
    ownedPlans: mockOwnedPlans,
    hasPlans: true,
  })

  const deleteButton = wrapper.find('.delete-btn')
  await deleteButton.trigger('click')

  expect(mockUsePlans.deleteItem).toHaveBeenCalledWith(mockOwnedPlans[0])
})

it('should open share dialog when share button is clicked', async () => {
  const { wrapper } = createWrapper({
    ownedPlans: mockOwnedPlans,
    hasPlans: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  const shareDialog = wrapper.findComponent(SharePlanDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('true')
  expect(shareDialog.attributes('data-plan-id')).toBe('plan-1')
})

it('should close share dialog and reload plans when plan is shared', async () => {
  const { wrapper, plansStore, notificationStore } = createWrapper({
    ownedPlans: mockOwnedPlans,
    hasPlans: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  const shareDialog = wrapper.findComponent(SharePlanDialogStub)
  const shareConfirmButton = shareDialog.find('.share-confirm-btn')
  await shareConfirmButton.trigger('click')

  expect(plansStore.loadPlans).toHaveBeenCalled()
  expect(notificationStore.showSuccess).toHaveBeenCalledWith('Plan shared successfully')
})

it('should call cancelPlan when cancel button is clicked', async () => {
  const { wrapper, plansStore, notificationStore } = createWrapper({
    ownedPlans: mockOwnedPlans,
    hasPlans: true,
  })

  const cancelButton = wrapper.find('.cancel-btn')
  await cancelButton.trigger('click')

  expect(plansStore.cancelPlan).toHaveBeenCalledWith('plan-1')
  expect(notificationStore.showSuccess).toHaveBeenCalledWith('Plan cancelled successfully')
})

it('should call loadPlans on mount', () => {
  const { plansStore } = createWrapper()
  expect(plansStore.loadPlans).toHaveBeenCalledOnce()
})

it('should reset plans store on unmount', () => {
  const { wrapper, plansStore } = createWrapper()

  wrapper.unmount()

  expect(plansStore.reset).toHaveBeenCalledOnce()
})

it('should update search query when search input changes', async () => {
  const { wrapper, mockUsePlans } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  await searchAndSort.vm.$emit('update:searchQuery', 'test query')

  expect(mockUsePlans.searchQuery.value).toBe('test query')
})

it('should update sort by when sort select changes', async () => {
  const { wrapper, mockUsePlans } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  await searchAndSort.vm.$emit('update:sortBy', 'total')

  expect(mockUsePlans.sortBy.value).toBe('total')
})

it('should show proper icons in empty states', () => {
  const { wrapper: emptyWrapper } = createWrapper({
    hasPlans: false,
  })

  const emptyState = emptyWrapper.findComponent(EmptyStateStub)
  expect(emptyState.props('emptyIcon')).toBe('eva-calendar-outline')

  const { wrapper: searchWrapper } = createWrapper({
    searchQuery: 'test',
    hasPlans: false,
  })

  const searchEmptyState = searchWrapper.findComponent(EmptyStateStub)
  expect(searchEmptyState.props('searchIcon')).toBe('eva-search-outline')
})

it('should handle empty plan arrays gracefully', () => {
  const { wrapper } = createWrapper({
    ownedPlans: [],
    sharedPlans: [],
    hasPlans: false,
  })

  expect(wrapper.find('[data-title="My Plans"]').exists()).toBe(false)
  expect(wrapper.find('[data-title="Shared with Me"]').exists()).toBe(false)

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.exists()).toBe(true)
})

it('should show only owned plans group when no shared plans', () => {
  const { wrapper } = createWrapper({
    ownedPlans: mockOwnedPlans,
    sharedPlans: [],
    hasPlans: true,
  })

  expect(wrapper.find('[data-title="My Plans"]').exists()).toBe(true)
  expect(wrapper.find('[data-title="Shared with Me"]').exists()).toBe(false)
})

it('should show only shared plans group when no owned plans', () => {
  const { wrapper } = createWrapper({
    ownedPlans: [],
    sharedPlans: mockSharedPlans,
    hasPlans: true,
  })

  expect(wrapper.find('[data-title="My Plans"]').exists()).toBe(false)
  expect(wrapper.find('[data-title="Shared with Me"]').exists()).toBe(true)
})

it('should pass correct sort options to search and sort component', () => {
  const { wrapper } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  const sortOptions = searchAndSort.props('sortOptions')

  expect(sortOptions).toHaveLength(4)
  expect(sortOptions[0]).toEqual({ label: 'Name', value: 'name' })
  expect(sortOptions[1]).toEqual({ label: 'Total Amount', value: 'total' })
  expect(sortOptions[2]).toEqual({ label: 'Start Date', value: 'start_date' })
  expect(sortOptions[3]).toEqual({ label: 'Created Date', value: 'created_at' })
})

it('should create new plan when create button clicked from empty state', async () => {
  const { wrapper, mockUsePlans } = createWrapper({
    hasPlans: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  await emptyState.vm.$emit('create')

  expect(mockUsePlans.goToNew).toHaveBeenCalledOnce()
})

it('should show proper create button label in empty state', () => {
  const { wrapper } = createWrapper({
    hasPlans: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.props('createButtonLabel')).toBe('Create Your First Plan')
})

it('should handle plan operations for both owned and shared plans', async () => {
  const { wrapper, mockUsePlans } = createWrapper({
    ownedPlans: mockOwnedPlans,
    sharedPlans: mockSharedPlans,
    hasPlans: true,
  })

  const ownedGroup = wrapper.find('[data-title="My Plans"]')
  const sharedGroup = wrapper.find('[data-title="Shared with Me"]')

  expect(ownedGroup.exists()).toBe(true)
  expect(sharedGroup.exists()).toBe(true)

  const editButtons = wrapper.findAll('.edit-btn')
  expect(editButtons.length).toBe(3)

  await editButtons[0]?.trigger('click')
  expect(mockUsePlans.viewItem).toHaveBeenCalledWith('plan-1')
})

it('should maintain reactive search and sort state', () => {
  const { wrapper, mockUsePlans } = createWrapper({
    searchQuery: 'initial',
    sortBy: 'name',
  })

  expect(mockUsePlans.searchQuery.value).toBe('initial')
  expect(mockUsePlans.sortBy.value).toBe('name')

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  expect(searchAndSort.props('searchQuery')).toBe('initial')
  expect(searchAndSort.props('sortBy')).toBe('name')
})

it('should close share dialog when model value changes', async () => {
  const { wrapper } = createWrapper({
    ownedPlans: mockOwnedPlans,
    hasPlans: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  let shareDialog = wrapper.findComponent(SharePlanDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('true')

  await shareDialog.vm.$emit('update:modelValue', false)

  shareDialog = wrapper.findComponent(SharePlanDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('false')
})
