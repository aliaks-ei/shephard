import { mount } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref, computed } from 'vue'
import TemplatesPage from './TemplatesPage.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import { useExpenseTemplates } from 'src/composables/useExpenseTemplates'
import type { ExpenseTemplateWithPermission } from 'src/api'

installQuasarPlugin()

vi.mock('src/composables/useExpenseTemplates')

const ExpenseTemplatesGroupStub = {
  template: `
    <div
      class="expense-templates-group-mock"
      :data-title="title"
      :data-templates-count="templates ? templates.length : 0"
      :data-chip-color="chipColor"
      :data-hide-shared-badge="hideSharedBadge"
    >
      <div v-for="template in templates" :key="template.id" class="template-item">
        <button @click="$emit('edit', template.id)" class="edit-btn">Edit</button>
        <button @click="$emit('delete', template)" class="delete-btn">Delete</button>
        <button @click="$emit('share', template.id)" class="share-btn">Share</button>
      </div>
    </div>
  `,
  props: ['title', 'templates', 'chipColor', 'hideSharedBadge'],
  emits: ['edit', 'delete', 'share'],
}

const ShareExpenseTemplateDialogStub = {
  template: `
    <div
      class="share-dialog-mock"
      :data-model-value="modelValue"
      :data-template-id="templateId"
    >
      <button @click="$emit('shared')" class="share-confirm-btn">Share</button>
    </div>
  `,
  props: ['modelValue', 'templateId'],
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

const mockOwnedTemplates: ExpenseTemplateWithPermission[] = [
  {
    id: 'template-1',
    name: 'Grocery Shopping',
    currency: 'USD',
    total: 15000,
    duration: '7 days',
    owner_id: 'user-1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    permission_level: 'owner',
    is_shared: false,
  },
  {
    id: 'template-2',
    name: 'Monthly Utilities',
    currency: 'USD',
    total: 25000,
    duration: '30 days',
    owner_id: 'user-1',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    permission_level: 'owner',
    is_shared: true,
  },
]

const mockSharedTemplates: ExpenseTemplateWithPermission[] = [
  {
    id: 'template-3',
    name: 'Team Lunch',
    currency: 'USD',
    total: 8000,
    duration: '7 days',
    owner_id: 'user-2',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
    permission_level: 'edit',
    is_shared: true,
  },
]

function createWrapper(
  options: {
    ownedTemplates?: ExpenseTemplateWithPermission[]
    sharedTemplates?: ExpenseTemplateWithPermission[]
    isLoading?: boolean
    hasTemplates?: boolean
    searchQuery?: string
    sortBy?: string
  } = {},
) {
  const {
    ownedTemplates = [],
    sharedTemplates = [],
    isLoading = false,
    hasTemplates = false,
    searchQuery = '',
    sortBy = 'name',
  } = options

  const mockExpenseTemplatesReturn = {
    searchQuery: ref(searchQuery),
    sortBy: ref(sortBy),
    areItemsLoading: computed(() => isLoading),
    filteredAndSortedOwnedItems: computed(() => ownedTemplates),
    filteredAndSortedSharedItems: computed(() => sharedTemplates),
    allFilteredAndSortedItems: computed(() => [...ownedTemplates, ...sharedTemplates]),
    hasItems: computed(() => hasTemplates),
    sortOptions: [
      { label: 'Name', value: 'name' },
      { label: 'Total Amount', value: 'total' },
      { label: 'Duration', value: 'duration' },
      { label: 'Created Date', value: 'created_at' },
    ],
    emptyStateConfig: computed(() => ({
      searchIcon: 'eva-search-outline',
      emptyIcon: 'eva-file-text-outline',
      searchTitle: 'No templates found',
      emptyTitle: 'No templates yet',
      searchDescription: 'Try adjusting your search terms or create a new template',
      emptyDescription: 'Create your first template to start managing your expenses efficiently',
      createLabel: 'Create Your First Template',
    })),
    goToNew: vi.fn(),
    viewItem: vi.fn(),
    deleteItem: vi.fn(),
    clearSearch: vi.fn(),
  }

  vi.mocked(useExpenseTemplates).mockReturnValue(mockExpenseTemplatesReturn)

  const wrapper = mount(TemplatesPage, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
      stubs: {
        ExpenseTemplatesGroup: ExpenseTemplatesGroupStub,
        ShareExpenseTemplateDialog: ShareExpenseTemplateDialogStub,
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
    mockUseExpenseTemplates: mockExpenseTemplatesReturn,
    templatesStore: useTemplatesStore(),
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

  expect(wrapper.find('h1').text()).toBe('Templates')
  expect(wrapper.text()).toContain('Manage your expense templates and create new ones')
})

it('should render create template button', () => {
  const { wrapper } = createWrapper()

  const createButton = wrapper.find('[data-label="Create Template"]')
  expect(createButton.exists()).toBe(true)
  expect(createButton.attributes('data-color')).toBe('primary')
  expect(createButton.attributes('data-icon')).toBe('eva-plus-outline')
})

it('should call goToNew when create button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper()

  const createButton = wrapper.find('[data-label="Create Template"]')
  await createButton.trigger('click')

  expect(mockUseExpenseTemplates.goToNew).toHaveBeenCalledOnce()
})

it('should render search and sort component', () => {
  const { wrapper } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  expect(searchAndSort.exists()).toBe(true)
  expect(searchAndSort.props('searchPlaceholder')).toBe('Search templates...')
})

it('should show loading skeleton when templates are loading', () => {
  const { wrapper } = createWrapper({ isLoading: true })

  const skeleton = wrapper.findComponent(ListPageSkeletonStub)
  expect(skeleton.exists()).toBe(true)

  const templateGroups = wrapper.findAll('.expense-templates-group-mock')
  expect(templateGroups.length).toBe(0)
})

it('should show owned templates group when owned templates exist', () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const ownedGroup = wrapper.find('[data-title="My Templates"]')
  expect(ownedGroup.exists()).toBe(true)
  expect(ownedGroup.attributes('data-templates-count')).toBe('2')
})

it('should show shared templates group when shared templates exist', () => {
  const { wrapper } = createWrapper({
    sharedTemplates: mockSharedTemplates,
    hasTemplates: true,
  })

  const sharedGroup = wrapper.find('[data-title="Shared with Me"]')
  expect(sharedGroup.exists()).toBe(true)
  expect(sharedGroup.attributes('data-templates-count')).toBe('1')
})

it('should show both template groups when both exist', () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    sharedTemplates: mockSharedTemplates,
    hasTemplates: true,
  })

  const ownedGroup = wrapper.find('[data-title="My Templates"]')
  const sharedGroup = wrapper.find('[data-title="Shared with Me"]')

  expect(ownedGroup.exists()).toBe(true)
  expect(sharedGroup.exists()).toBe(true)
})

it('should show empty state when no templates and not loading', () => {
  const { wrapper } = createWrapper({
    isLoading: false,
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.exists()).toBe(true)
  expect(emptyState.props('hasSearchQuery')).toBe(false)
  expect(emptyState.props('emptyTitle')).toBe('No templates yet')
  expect(emptyState.props('emptyDescription')).toBe(
    'Create your first template to start managing your expenses efficiently',
  )
})

it('should show search empty state when searching with no results', () => {
  const { wrapper } = createWrapper({
    searchQuery: 'nonexistent',
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.exists()).toBe(true)
  expect(emptyState.props('hasSearchQuery')).toBe(true)
  expect(emptyState.props('searchTitle')).toBe('No templates found')
  expect(emptyState.props('searchDescription')).toBe(
    'Try adjusting your search terms or create a new template',
  )
})

it('should clear search when clear search button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    searchQuery: 'test',
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  await emptyState.vm.$emit('clear-search')

  expect(mockUseExpenseTemplates.clearSearch).toHaveBeenCalledOnce()
})

it('should call viewItem when edit button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const editButton = wrapper.find('.edit-btn')
  await editButton.trigger('click')

  expect(mockUseExpenseTemplates.viewItem).toHaveBeenCalledWith('template-1')
})

it('should call deleteItem when delete button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const deleteButton = wrapper.find('.delete-btn')
  await deleteButton.trigger('click')

  expect(mockUseExpenseTemplates.deleteItem).toHaveBeenCalledWith(mockOwnedTemplates[0])
})

it('should open share dialog when share button is clicked', async () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  const shareDialog = wrapper.findComponent(ShareExpenseTemplateDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('true')
  expect(shareDialog.attributes('data-template-id')).toBe('template-1')
})

it('should close share dialog and reload templates when template is shared', async () => {
  const { wrapper, templatesStore, notificationStore } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  const shareDialog = wrapper.findComponent(ShareExpenseTemplateDialogStub)
  const shareConfirmButton = shareDialog.find('.share-confirm-btn')
  await shareConfirmButton.trigger('click')

  expect(templatesStore.loadTemplates).toHaveBeenCalled()
  expect(notificationStore.showSuccess).toHaveBeenCalledWith('Template shared successfully')
})

it('should call loadTemplates on mount', () => {
  const { templatesStore } = createWrapper()
  expect(templatesStore.loadTemplates).toHaveBeenCalledOnce()
})

it('should reset templates store on unmount', () => {
  const { wrapper, templatesStore } = createWrapper()

  wrapper.unmount()

  expect(templatesStore.reset).toHaveBeenCalledOnce()
})

it('should pass correct sort options to search and sort component', () => {
  const { wrapper } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  const sortOptions = searchAndSort.props('sortOptions')

  expect(sortOptions).toHaveLength(4)
  expect(sortOptions[0]).toEqual({ label: 'Name', value: 'name' })
  expect(sortOptions[1]).toEqual({ label: 'Total Amount', value: 'total' })
  expect(sortOptions[2]).toEqual({ label: 'Duration', value: 'duration' })
  expect(sortOptions[3]).toEqual({ label: 'Created Date', value: 'created_at' })
})

it('should update search query when search input changes', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  await searchAndSort.vm.$emit('update:searchQuery', 'test query')

  expect(mockUseExpenseTemplates.searchQuery.value).toBe('test query')
})

it('should update sort by when sort select changes', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  await searchAndSort.vm.$emit('update:sortBy', 'total')

  expect(mockUseExpenseTemplates.sortBy.value).toBe('total')
})

it('should show proper icons in empty states', () => {
  const { wrapper: emptyWrapper } = createWrapper({
    hasTemplates: false,
  })

  const emptyState = emptyWrapper.findComponent(EmptyStateStub)
  expect(emptyState.props('emptyIcon')).toBe('eva-file-text-outline')

  const { wrapper: searchWrapper } = createWrapper({
    searchQuery: 'test',
    hasTemplates: false,
  })

  const searchEmptyState = searchWrapper.findComponent(EmptyStateStub)
  expect(searchEmptyState.props('searchIcon')).toBe('eva-search-outline')
})

it('should create new template when create button clicked from empty state', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  await emptyState.vm.$emit('create')

  expect(mockUseExpenseTemplates.goToNew).toHaveBeenCalledOnce()
})

it('should handle empty template arrays gracefully', () => {
  const { wrapper } = createWrapper({
    ownedTemplates: [],
    sharedTemplates: [],
    hasTemplates: false,
  })

  expect(wrapper.find('[data-title="My Templates"]').exists()).toBe(false)
  expect(wrapper.find('[data-title="Shared with Me"]').exists()).toBe(false)

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.exists()).toBe(true)
})

it('should show only owned templates group when no shared templates', () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    sharedTemplates: [],
    hasTemplates: true,
  })

  expect(wrapper.find('[data-title="My Templates"]').exists()).toBe(true)
  expect(wrapper.find('[data-title="Shared with Me"]').exists()).toBe(false)
})

it('should show only shared templates group when no owned templates', () => {
  const { wrapper } = createWrapper({
    ownedTemplates: [],
    sharedTemplates: mockSharedTemplates,
    hasTemplates: true,
  })

  expect(wrapper.find('[data-title="My Templates"]').exists()).toBe(false)
  expect(wrapper.find('[data-title="Shared with Me"]').exists()).toBe(true)
})

it('should show proper create button label in empty state', () => {
  const { wrapper } = createWrapper({
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.props('createButtonLabel')).toBe('Create Your First Template')
})

it('should maintain reactive search and sort state', () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    searchQuery: 'initial',
    sortBy: 'name',
  })

  expect(mockUseExpenseTemplates.searchQuery.value).toBe('initial')
  expect(mockUseExpenseTemplates.sortBy.value).toBe('name')

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  expect(searchAndSort.props('searchQuery')).toBe('initial')
  expect(searchAndSort.props('sortBy')).toBe('name')
})

it('should close share dialog when model value changes', async () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  let shareDialog = wrapper.findComponent(ShareExpenseTemplateDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('true')

  await shareDialog.vm.$emit('update:modelValue', false)

  shareDialog = wrapper.findComponent(ShareExpenseTemplateDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('false')
})
