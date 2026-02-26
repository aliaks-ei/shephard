import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import TemplateCardMenu from './TemplateCardMenu.vue'

installQuasarPlugin()

type TemplateCardMenuProps = ComponentProps<typeof TemplateCardMenu>

const renderTemplateCardMenu = (props: TemplateCardMenuProps) => {
  return mount(TemplateCardMenu, {
    props,
    global: {
      stubs: {
        QMenu: {
          template: '<div><slot /></div>',
        },
      },
    },
  })
}

describe('TemplateCardMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderTemplateCardMenu({
      canEdit: true,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct props interface', () => {
    const wrapper = renderTemplateCardMenu({
      canEdit: true,
      permissionLevel: 'edit',
    })

    expect(wrapper.props('canEdit')).toBe(true)
    expect(wrapper.props('permissionLevel')).toBe('edit')
  })

  it('should emit share event when share item is clicked', async () => {
    const wrapper = renderTemplateCardMenu({
      canEdit: true,
    })

    const items = wrapper.findAll('.q-item')
    expect(items.length).toBeGreaterThan(0)
    await items[0]?.trigger('click')
    expect(wrapper.emitted('share')).toBeTruthy()
  })

  it('should emit delete event when delete item is clicked', async () => {
    const wrapper = renderTemplateCardMenu({
      canEdit: true,
    })

    const items = wrapper.findAll('.q-item')
    expect(items.length).toBeGreaterThan(1)
    await items[1]?.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('should handle owner prop correctly', () => {
    const ownerWrapper = renderTemplateCardMenu({
      canEdit: true,
    })
    expect(ownerWrapper.props('canEdit')).toBe(true)

    const nonOwnerWrapper = renderTemplateCardMenu({
      canEdit: false,
    })
    expect(nonOwnerWrapper.props('canEdit')).toBe(false)
  })

  it('should handle permission level prop', () => {
    const editWrapper = renderTemplateCardMenu({
      canEdit: false,
      permissionLevel: 'edit',
    })
    expect(editWrapper.props('permissionLevel')).toBe('edit')

    const viewWrapper = renderTemplateCardMenu({
      canEdit: false,
      permissionLevel: 'view',
    })
    expect(viewWrapper.props('permissionLevel')).toBe('view')
  })

  it('should handle undefined permission level', () => {
    const wrapper = renderTemplateCardMenu({
      canEdit: false,
      permissionLevel: undefined,
    })
    expect(wrapper.props('permissionLevel')).toBeUndefined()
  })

  it('should handle missing permission level', () => {
    const wrapper = renderTemplateCardMenu({
      canEdit: false,
    })
    expect(wrapper.props('permissionLevel')).toBeUndefined()
  })
})
