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
    areTemplatesLoading: computed(() => isLoading),
    filteredAndSortedOwnedTemplates: computed(() => ownedTemplates),
    filteredAndSortedSharedTemplates: computed(() => sharedTemplates),
    hasTemplates: computed(() => hasTemplates),
    goToNewTemplate: vi.fn(),
    viewTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
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
        QInput: {
          template: `
            <div class="q-input">
              <input
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
                :placeholder="placeholder"
              />
              <slot name="prepend" />
            </div>
          `,
          props: ['modelValue', 'placeholder', 'debounce', 'outlined', 'clearable'],
          emits: ['update:modelValue'],
        },
        QSelect: {
          template: `
            <div class="q-select">
              <select
                :value="modelValue"
                @change="$emit('update:modelValue', $event.target.value)"
              >
                <option v-for="option in options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          `,
          props: ['modelValue', 'options', 'label', 'outlined', 'emitValue'],
          emits: ['update:modelValue'],
        },
        QSkeleton: {
          template: `
            <div
              class="q-skeleton"
              :data-type="type"
              :data-width="width"
              :data-height="height"
            ></div>
          `,
          props: ['type', 'width', 'height'],
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

it('should call goToNewTemplate when create button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper()

  const createButton = wrapper.find('[data-label="Create Template"]')
  await createButton.trigger('click')

  expect(mockUseExpenseTemplates.goToNewTemplate).toHaveBeenCalledOnce()
})

it('should render search input and sort select', () => {
  const { wrapper } = createWrapper()

  const searchInput = wrapper.find('.q-input input')
  expect(searchInput.exists()).toBe(true)
  expect(searchInput.attributes('placeholder')).toBe('Search templates...')

  const sortSelect = wrapper.find('.q-select')
  expect(sortSelect.exists()).toBe(true)
})

it('should show loading skeletons when templates are loading', () => {
  const { wrapper } = createWrapper({ isLoading: true })

  const skeletons = wrapper.findAll('.q-skeleton')
  expect(skeletons.length).toBe(18)

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

  expect(wrapper.text()).toContain('No templates yet')
  expect(wrapper.text()).toContain(
    'Create your first template to start managing your expenses efficiently',
  )
  expect(wrapper.find('[data-label="Create Your First Template"]').exists()).toBe(true)
})

it('should show search empty state when searching with no results', () => {
  const { wrapper } = createWrapper({
    searchQuery: 'nonexistent',
    hasTemplates: false,
  })

  expect(wrapper.text()).toContain('No templates found')
  expect(wrapper.text()).toContain('Try adjusting your search terms or create a new template')
  expect(wrapper.find('[data-label="Clear Search"]').exists()).toBe(true)
})

it('should clear search when clear search button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    searchQuery: 'test',
    hasTemplates: false,
  })

  const clearButton = wrapper.find('[data-label="Clear Search"]')
  await clearButton.trigger('click')

  expect(mockUseExpenseTemplates.searchQuery.value).toBe('')
})

it('should call viewTemplate when edit button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const editButton = wrapper.find('.edit-btn')
  await editButton.trigger('click')

  expect(mockUseExpenseTemplates.viewTemplate).toHaveBeenCalledWith('template-1')
})

it('should call deleteTemplate when delete button is clicked', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper({
    ownedTemplates: mockOwnedTemplates,
    hasTemplates: true,
  })

  const deleteButton = wrapper.find('.delete-btn')
  await deleteButton.trigger('click')

  expect(mockUseExpenseTemplates.deleteTemplate).toHaveBeenCalledWith(mockOwnedTemplates[0])
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

it('should render correct sort options', () => {
  const { wrapper } = createWrapper()

  const sortSelect = wrapper.find('.q-select select')
  const options = sortSelect.findAll('option')

  expect(options).toHaveLength(4)
  expect(options[0]?.text()).toBe('Name')
  expect(options[1]?.text()).toBe('Total Amount')
  expect(options[2]?.text()).toBe('Duration')
  expect(options[3]?.text()).toBe('Created Date')
})

it('should update search query when input changes', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper()

  const searchInput = wrapper.find('.q-input input')
  await searchInput.setValue('test query')

  expect(mockUseExpenseTemplates.searchQuery.value).toBe('test query')
})

it('should update sort by when select changes', async () => {
  const { wrapper, mockUseExpenseTemplates } = createWrapper()

  const sortSelect = wrapper.find('.q-select select')
  await sortSelect.setValue('total')

  expect(mockUseExpenseTemplates.sortBy.value).toBe('total')
})

it('should show proper icons in empty states', () => {
  const { wrapper: emptyWrapper } = createWrapper({
    hasTemplates: false,
  })

  expect(emptyWrapper.find('[data-name="eva-file-text-outline"]').exists()).toBe(true)

  const { wrapper: searchWrapper } = createWrapper({
    searchQuery: 'test',
    hasTemplates: false,
  })

  expect(searchWrapper.find('[data-name="eva-search-outline"]').exists()).toBe(true)
})

it('should render search icon in input', () => {
  const { wrapper } = createWrapper()

  expect(wrapper.find('[data-name="eva-search-outline"]').exists()).toBe(true)
})

it('should handle empty template arrays gracefully', () => {
  const { wrapper } = createWrapper({
    ownedTemplates: [],
    sharedTemplates: [],
    hasTemplates: false,
  })

  expect(wrapper.find('[data-title="My Templates"]').exists()).toBe(false)
  expect(wrapper.find('[data-title="Shared with Me"]').exists()).toBe(false)
  expect(wrapper.text()).toContain('No templates yet')
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

it('should pass correct props to shared templates group', () => {
  const { wrapper } = createWrapper({
    sharedTemplates: mockSharedTemplates,
    hasTemplates: true,
  })

  const sharedGroup = wrapper.find('[data-title="Shared with Me"]')
  expect(sharedGroup.exists()).toBe(true)
})

it('should render proper page layout structure', () => {
  const { wrapper } = createWrapper()

  expect(wrapper.find('.row.justify-center.q-pa-md').exists()).toBe(true)
  expect(wrapper.find('.col-12.col-md-10.col-lg-8.col-xl-6').exists()).toBe(true)
  expect(wrapper.find('.row.items-center.justify-between.wrap').exists()).toBe(true)
})

it('should show loading state with proper skeleton count', () => {
  const { wrapper } = createWrapper({ isLoading: true })

  const skeletonCards = wrapper.findAll('.q-card')
  const skeletons = wrapper.findAll('.q-skeleton')

  expect(skeletonCards.length).toBeGreaterThan(0)
  expect(skeletons.length).toBe(18)
})
