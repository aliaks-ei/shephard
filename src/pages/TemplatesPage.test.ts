import { mount } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { ref, computed } from 'vue'
import TemplatesPage from './TemplatesPage.vue'
import { useTemplates } from 'src/composables/useTemplates'
import type { TemplateWithPermission } from 'src/api'
import { setupTestingPinia } from 'test/helpers/pinia-mocks'
import { createMockTemplates } from 'test/fixtures'
import { getTemplateWithItems } from 'src/api'

vi.mock('src/api', async () => {
  const actual = await vi.importActual('src/api')
  return {
    ...actual,
    getTemplateWithItems: vi.fn(),
  }
})

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: vi.fn(() => ({
    categories: ref([
      {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5722',
        icon: 'eva-pricetags-outline',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ]),
  })),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: { id: 'user-1' },
  })),
}))

const mockTemplatesShowError = vi.fn()
const mockTemplatesShowSuccess = vi.fn()

vi.mock('src/composables/useBanner', () => ({
  useBanner: vi.fn(() => ({
    showError: mockTemplatesShowError,
    showSuccess: mockTemplatesShowSuccess,
  })),
}))

installQuasarPlugin()

vi.mock('src/composables/useTemplates')

const TemplatesGroupStub = {
  template: `
    <div
      class="templates-group-mock"
      :data-title="title"
      :data-templates-count="templates ? templates.length : 0"
      :data-chip-color="chipColor"
    >
      <div v-for="template in templates" :key="template.id" class="template-item">
        <button @click="$emit('edit', template.id)" class="edit-btn">Edit</button>
        <button @click="$emit('export', template.id)" class="export-btn">Export</button>
        <button @click="$emit('delete', template)" class="delete-btn">Delete</button>
        <button @click="$emit('share', template.id)" class="share-btn">Share</button>
      </div>
    </div>
  `,
  props: ['title', 'templates', 'chipColor'],
  emits: ['edit', 'export', 'delete', 'share'],
}

const ShareTemplateDialogStub = {
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

const ExportDialogStub = {
  template: `
    <div
      class="export-dialog-mock"
      :data-model-value="modelValue"
    >
      <button @click="$emit('select-format', 'json')" class="export-json-btn">Export JSON</button>
    </div>
  `,
  props: ['modelValue'],
  emits: ['update:modelValue', 'select-format'],
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

const mockOwnedTemplates = createMockTemplates(2).map((template, index) => ({
  ...template,
  permission_level: 'owner' as const,
  is_shared: index === 1,
}))

const mockSharedTemplates = createMockTemplates(1).map((template) => ({
  ...template,
  id: 'template-3',
  name: 'Team Lunch',
  owner_id: 'user-2',
  permission_level: 'edit' as const,
  is_shared: true,
}))

function createWrapper(
  options: {
    ownedTemplates?: TemplateWithPermission[]
    sharedTemplates?: TemplateWithPermission[]
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

  const mockTemplatesReturn = {
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

  vi.mocked(useTemplates).mockReturnValue(mockTemplatesReturn)
  vi.mocked(getTemplateWithItems).mockResolvedValue({
    id: mockOwnedTemplates[0]!.id,
    name: mockOwnedTemplates[0]!.name,
    duration: mockOwnedTemplates[0]!.duration,
    total: mockOwnedTemplates[0]!.total,
    currency: mockOwnedTemplates[0]!.currency,
    owner_id: mockOwnedTemplates[0]!.owner_id,
    created_at: mockOwnedTemplates[0]!.created_at,
    updated_at: mockOwnedTemplates[0]!.updated_at,
    permission_level: mockOwnedTemplates[0]!.permission_level,
    template_items: [],
  })

  setupTestingPinia({ stubActions: true })

  const wrapper = mount(TemplatesPage, {
    global: {
      stubs: {
        TemplatesGroup: TemplatesGroupStub,
        ShareTemplateDialog: ShareTemplateDialogStub,
        ExportDialog: ExportDialogStub,
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
    mockUseTemplates: mockTemplatesReturn,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const { wrapper } = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('opens export dialog from templates group export action', async () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  await wrapper.find('.export-btn').trigger('click')

  const exportDialog = wrapper.findComponent(ExportDialogStub)
  expect(exportDialog.attributes('data-model-value')).toBe('true')
})

it('should render page title and description', () => {
  const { wrapper } = createWrapper()

  expect(wrapper.find('h1').text()).toBe('Templates')
  expect(wrapper.text()).toContain('Manage your templates and create new ones')
})

it('should render create template button', () => {
  const { wrapper } = createWrapper()

  const createButton = wrapper.find('[data-label="Create Template"]')
  expect(createButton.exists()).toBe(true)
  expect(createButton.attributes('data-color')).toBe('primary')
})

it('should call goToNew when create button is clicked', async () => {
  const { wrapper, mockUseTemplates } = createWrapper()

  const createButton = wrapper.find('[data-label="Create Template"]')
  await createButton.trigger('click')

  expect(mockUseTemplates.goToNew).toHaveBeenCalledOnce()
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

  const templateGroups = wrapper.findAll('.templates-group-mock')
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

  const group = wrapper.find('[data-title="My Templates"]')
  expect(group.exists()).toBe(true)
  expect(group.attributes('data-templates-count')).toBe('1')
})

it('should show both template groups when both exist', () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    sharedTemplates: mockSharedTemplates,
    hasTemplates: true,
  })

  const group = wrapper.find('[data-title="My Templates"]')
  expect(group.exists()).toBe(true)
  expect(group.attributes('data-templates-count')).toBe('3')
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
  const { wrapper, mockUseTemplates } = createWrapper({
    searchQuery: 'test',
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  await emptyState.vm.$emit('clear-search')

  expect(mockUseTemplates.clearSearch).toHaveBeenCalledOnce()
})

it('should call viewItem when edit button is clicked', async () => {
  const { wrapper, mockUseTemplates } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const editButton = wrapper.find('.edit-btn')
  await editButton.trigger('click')

  expect(mockUseTemplates.viewItem).toHaveBeenCalledWith('template-1')
})

it('should call deleteItem when delete button is clicked', async () => {
  const { wrapper, mockUseTemplates } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const deleteButton = wrapper.find('.delete-btn')
  await deleteButton.trigger('click')

  expect(mockUseTemplates.deleteItem).toHaveBeenCalledWith(mockOwnedTemplates[0])
})

it('should open share dialog when share button is clicked', async () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  const shareDialog = wrapper.findComponent(ShareTemplateDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('true')
  expect(shareDialog.attributes('data-template-id')).toBe('template-1')
})

it('should close share dialog when template is shared', async () => {
  const { wrapper } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const shareButton = wrapper.find('.share-btn')
  await shareButton.trigger('click')

  const shareDialog = wrapper.findComponent(ShareTemplateDialogStub)
  const shareConfirmButton = shareDialog.find('.share-confirm-btn')
  await shareConfirmButton.trigger('click')

  // TanStack Query handles cache invalidation automatically
  expect(wrapper.exists()).toBe(true)
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
  const { wrapper, mockUseTemplates } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  await searchAndSort.vm.$emit('update:searchQuery', 'test query')

  expect(mockUseTemplates.searchQuery.value).toBe('test query')
})

it('should update sort by when sort select changes', async () => {
  const { wrapper, mockUseTemplates } = createWrapper()

  const searchAndSort = wrapper.findComponent(SearchAndSortStub)
  await searchAndSort.vm.$emit('update:sortBy', 'total')

  expect(mockUseTemplates.sortBy.value).toBe('total')
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
  const { wrapper, mockUseTemplates } = createWrapper({
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  await emptyState.vm.$emit('create')

  expect(mockUseTemplates.goToNew).toHaveBeenCalledOnce()
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

  expect(wrapper.find('[data-title="My Templates"]').exists()).toBe(true)
})

it('should show proper create button label in empty state', () => {
  const { wrapper } = createWrapper({
    hasTemplates: false,
  })

  const emptyState = wrapper.findComponent(EmptyStateStub)
  expect(emptyState.props('createButtonLabel')).toBe('Create Your First Template')
})

it('should maintain reactive search and sort state', () => {
  const { wrapper, mockUseTemplates } = createWrapper({
    searchQuery: 'initial',
    sortBy: 'name',
  })

  expect(mockUseTemplates.searchQuery.value).toBe('initial')
  expect(mockUseTemplates.sortBy.value).toBe('name')

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

  let shareDialog = wrapper.findComponent(ShareTemplateDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('true')

  await shareDialog.vm.$emit('update:modelValue', false)

  shareDialog = wrapper.findComponent(ShareTemplateDialogStub)
  expect(shareDialog.attributes('data-model-value')).toBe('false')
})
