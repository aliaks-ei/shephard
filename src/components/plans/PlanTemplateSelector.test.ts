import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanTemplateSelector from './PlanTemplateSelector.vue'
import type { ExpenseTemplateWithItems, ExpenseTemplateWithPermission } from 'src/api'
import { useTemplatesStore } from 'src/stores/templates'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

vi.mock('src/utils/expense-templates', () => ({
  getPermissionText: vi.fn((level: string) => (level === 'edit' ? 'Can Edit' : 'View Only')),
  getPermissionColor: vi.fn(() => 'primary'),
  getPermissionIcon: vi.fn(() => 'eva-edit-outline'),
}))

installQuasarPlugin()

type PlanTemplateSelectorProps = ComponentProps<typeof PlanTemplateSelector>

const baseTemplate: ExpenseTemplateWithPermission = {
  id: 't1',
  name: 'Template 1',
  owner_id: 'u1',
  currency: 'USD',
  duration: '1 hour',
  total: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  permission_level: 'edit',
  is_shared: true,
}

const fullTemplate: ExpenseTemplateWithItems = {
  ...baseTemplate,
  expense_template_items: [
    {
      id: 'i1',
      name: 'Item',
      amount: 100,
      category_id: 'c1',
      template_id: 't1',
      created_at: '',
      updated_at: '',
    },
  ],
}

const renderPlanTemplateSelector = (props: PlanTemplateSelectorProps) => {
  return mount(PlanTemplateSelector, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
          initialState: {
            templates: {
              isLoading: false,
              templates: [baseTemplate],
            },
          },
        }),
      ],
      stubs: {
        'q-card': { template: '<div v-bind="$attrs"><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-badge': { template: '<span class="badge"><slot /></span>' },
        'q-icon': { template: '<i />' },
        'q-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        'q-skeleton': { template: '<div class="skel" />' },
        'q-banner': { template: '<div><slot /><slot name="action" /></div>' },
      },
      mocks: {
        $router: { push: vi.fn() },
      },
    },
  })
}

describe('PlanTemplateSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanTemplateSelector({ modelValue: null })
    expect(wrapper.exists()).toBe(true)
  })

  it('should show loading skeleton when loading', () => {
    const wrapper = mount(PlanTemplateSelector, {
      props: { modelValue: null },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: true,
            initialState: {
              templates: { isLoading: true, templates: [], loadTemplates: vi.fn() },
            },
          }),
        ],
        stubs: { 'q-skeleton': { template: '<div class="skel" />' } },
      },
    })
    expect(wrapper.findAll('.skel').length).toBeGreaterThan(0)
  })

  it('should show empty banner when no templates', () => {
    const wrapper = mount(PlanTemplateSelector, {
      props: { modelValue: null },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: true,
            initialState: { templates: { isLoading: false, templates: [] } },
          }),
        ],
        stubs: {
          'q-banner': { template: '<div class="banner"><slot /><slot name="action" /></div>' },
          'q-btn': { template: '<button class="go" @click="$emit(\'click\')" />' },
        },
        mocks: { $router: { push: vi.fn() } },
      },
    })
    expect(wrapper.find('.banner').exists()).toBe(true)
  })

  it('should select a template and emit template-selected', async () => {
    const wrapper = renderPlanTemplateSelector({ modelValue: null })
    const store = useTemplatesStore()
    vi.mocked(store.loadTemplateWithItems).mockResolvedValue(fullTemplate)
    const card = wrapper.find('.cursor-pointer')
    await card.trigger('click')
    expect(wrapper.emitted('template-selected')).toBeTruthy()
    const emitted = wrapper.emitted('template-selected')?.[0]?.[0] as
      | ExpenseTemplateWithItems
      | undefined
    expect(emitted?.id).toBe('t1')
  })

  it('should highlight selected card', async () => {
    const wrapper = renderPlanTemplateSelector({ modelValue: null })
    const store = useTemplatesStore()
    vi.mocked(store.loadTemplateWithItems).mockResolvedValue(fullTemplate)
    const card = wrapper.find('.cursor-pointer')
    await card.trigger('click')
    await nextTick()
    expect(wrapper.find('.border-primary').exists()).toBe(true)
  })
})
