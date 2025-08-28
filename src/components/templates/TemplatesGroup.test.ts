import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import TemplatesGroup from './TemplatesGroup.vue'
import type { TemplateWithPermission } from 'src/api'

installQuasarPlugin()

type TemplatesGroupProps = ComponentProps<typeof TemplatesGroup>

const mockTemplate: TemplateWithPermission = {
  id: 'template-1',
  name: 'Test Template',
  owner_id: 'user-1',
  currency: 'USD',
  duration: '1 hour',
  total: 100,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  permission_level: 'edit',
  is_shared: true,
}

const renderTemplatesGroup = (props: TemplatesGroupProps) => {
  return mount(TemplatesGroup, {
    props,
    global: {
      stubs: {
        TemplateCard: true,
      },
    },
  })
}

describe('TemplatesGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render title', () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
    })

    expect(wrapper.text()).toContain('My Templates')
  })

  it('should display template count', () => {
    const templates = [mockTemplate, { ...mockTemplate, id: 'template-2' }]
    const wrapper = renderTemplatesGroup({
      templates,
      title: 'My Templates',
    })

    expect(wrapper.text()).toContain('2')
  })

  it('should handle empty templates array', () => {
    const wrapper = renderTemplatesGroup({
      templates: [],
      title: 'Empty Templates',
    })

    expect(wrapper.text()).toContain('Empty Templates')
    expect(wrapper.text()).toContain('0')
  })

  it('should emit edit event when child card emits edit', async () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
    })

    const templateCard = wrapper.findComponent({ name: 'TemplateCard' })
    await templateCard.vm.$emit('edit', 'template-1')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual(['template-1'])
  })

  it('should emit delete event when child card emits delete', async () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
    })

    const templateCard = wrapper.findComponent({ name: 'TemplateCard' })
    await templateCard.vm.$emit('delete', mockTemplate)
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockTemplate])
  })

  it('should emit share event when child card emits share', async () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
    })

    const templateCard = wrapper.findComponent({ name: 'TemplateCard' })
    await templateCard.vm.$emit('share', 'template-1')
    expect(wrapper.emitted('share')).toBeTruthy()
    expect(wrapper.emitted('share')?.[0]).toEqual(['template-1'])
  })

  it('should use default chipColor', () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
    })

    expect(wrapper.props('chipColor')).toBe('primary')
  })

  it('should use custom chipColor', () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
      chipColor: 'secondary',
    })

    expect(wrapper.props('chipColor')).toBe('secondary')
  })

  it('should use default hideSharedBadge', () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
    })

    expect(wrapper.props('hideSharedBadge')).toBe(false)
  })

  it('should use custom hideSharedBadge', () => {
    const wrapper = renderTemplatesGroup({
      templates: [mockTemplate],
      title: 'My Templates',
      hideSharedBadge: true,
    })

    expect(wrapper.props('hideSharedBadge')).toBe(true)
  })
})
