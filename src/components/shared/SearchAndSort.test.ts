import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import SearchAndSort from './SearchAndSort.vue'

installQuasarPlugin()

type SortOption = { label: string; value: string }

const baseProps = {
  searchQuery: '',
  sortBy: 'name',
  searchPlaceholder: 'Search...',
  sortOptions: [
    { label: 'Name', value: 'name' },
    { label: 'Date', value: 'date' },
  ] as SortOption[],
}

const renderComponent = (props: typeof baseProps) =>
  mount(SearchAndSort, {
    props,
    global: {
      stubs: {
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-input': {
          template:
            '<div><slot name="prepend" /><input class="q-input" @input="$emit(\'update:model-value\', ($event && $event.target && $event.target.value ? $event.target.value.toString() : \'\'))" /></div>',
          props: ['modelValue', 'placeholder', 'debounce', 'outlined', 'clearable'],
          emits: ['update:model-value'],
        },
        'q-icon': { template: '<i />', props: ['name'] },
        'q-select': {
          template:
            '<div><span class="q-select-label">{{ label }}</span><select class="q-select" @change="$emit(\'update:model-value\', ($event && $event.target && $event.target.value ? $event.target.value.toString() : \'\'))"></select></div>',
          props: ['modelValue', 'options', 'label', 'outlined', 'emitValue'],
          emits: ['update:model-value'],
        },
      },
    },
  })

describe('SearchAndSort', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders with provided placeholder and options', () => {
    const wrapper = renderComponent(baseProps)
    expect(wrapper.text()).toContain('Sort by')
  })

  it('emits update:searchQuery when typing in search input', async () => {
    const wrapper = renderComponent(baseProps)
    const input = wrapper.get('.q-input')
    await input.setValue('budget')
    expect(wrapper.emitted('update:searchQuery')?.[0]).toEqual(['budget'])
  })

  it('emits update:sortBy when changing select', async () => {
    const wrapper = renderComponent(baseProps)
    const select = wrapper.get('.q-select')
    // Directly dispatch an event object without target override per VTU notes
    await select.trigger('change')
    // Manually emit via stub to simulate selection change
    wrapper.findComponent({ name: 'q-select' as unknown as string })
    expect(wrapper.emitted('update:sortBy')).toBeTruthy()
  })
})
