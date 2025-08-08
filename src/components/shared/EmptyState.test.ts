import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import EmptyState from './EmptyState.vue'

installQuasarPlugin()

type EmptyStateProps = {
  hasSearchQuery: boolean
  searchIcon?: string
  emptyIcon?: string
  searchTitle?: string
  emptyTitle?: string
  searchDescription?: string
  emptyDescription?: string
  createButtonLabel?: string
}

const renderComponent = (props: EmptyStateProps) =>
  mount(EmptyState, {
    props,
    global: {
      stubs: {
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-icon': { template: '<i />', props: ['name', 'size'] },
        'q-btn': {
          template: '<button class="q-btn" @click="$emit(\'click\')">{{ label }}</button>',
          props: ['flat', 'color', 'icon', 'label', 'unelevated'],
          emits: ['click'],
        },
      },
    },
  })

describe('EmptyState', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders with defaults for empty state when hasSearchQuery=false', () => {
    const wrapper = renderComponent({ hasSearchQuery: false })
    expect(wrapper.text()).toContain('No items yet')
    expect(wrapper.text()).toContain('Create your first item to get started')
    expect(wrapper.text()).toContain('Create Item')
  })

  it('renders with defaults for search state when hasSearchQuery=true', () => {
    const wrapper = renderComponent({ hasSearchQuery: true })
    expect(wrapper.text()).toContain('No results found')
    expect(wrapper.text()).toContain('Try adjusting your search terms or create a new item')
  })

  it('emits clearSearch when clear button is clicked and hasSearchQuery=true', async () => {
    const wrapper = renderComponent({ hasSearchQuery: true })
    const buttons = wrapper.findAll('button')
    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('clearSearch')).toBeTruthy()
  })

  it('emits create when create button is clicked', async () => {
    const wrapper = renderComponent({ hasSearchQuery: false })
    const createButton = wrapper.findAll('button')[0]
    await createButton?.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('supports overriding all text and icons via props', () => {
    const wrapper = renderComponent({
      hasSearchQuery: true,
      searchIcon: 'custom-search',
      emptyIcon: 'custom-empty',
      searchTitle: 'Search none',
      emptyTitle: 'Empty none',
      searchDescription: 'Search desc',
      emptyDescription: 'Empty desc',
      createButtonLabel: 'Add',
    })
    expect(wrapper.text()).toContain('Search none')
    expect(wrapper.text()).toContain('Search desc')
    expect(wrapper.text()).toContain('Add')
  })
})
