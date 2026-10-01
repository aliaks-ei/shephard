import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import CategoryIcon from './CategoryIcon.vue'
import { QIcon } from 'quasar'

installQuasarPlugin()

describe('CategoryIcon', () => {
  it('renders a tinted tile with the default small size', () => {
    const wrapper = mount(CategoryIcon, {
      props: {
        color: '#FF5722',
        icon: 'eva-home-outline',
      },
    })

    const tile = wrapper.find('.category-icon')
    expect(tile.classes()).toContain('category-tone-tile')
    expect(tile.attributes('style')).toContain('width: 36px')
    expect(tile.attributes('style')).toContain('--cat-h')

    const icon = wrapper.findComponent(QIcon)
    expect(icon.props('name')).toBe('eva-home-outline')
    expect(icon.props('size')).toBe('18px')
  })

  it('renders with medium and large sizes', () => {
    const md = mount(CategoryIcon, {
      props: { color: '#4CAF50', icon: 'eva-shopping-cart-outline', size: 'md' },
    })
    expect(md.find('.category-icon').attributes('style')).toContain('width: 48px')
    expect(md.findComponent(QIcon).props('size')).toBe('24px')

    const lg = mount(CategoryIcon, {
      props: { color: '#2196F3', icon: 'eva-heart-outline', size: 'lg' },
    })
    expect(lg.find('.category-icon').attributes('style')).toContain('width: 64px')
    expect(lg.findComponent(QIcon).props('size')).toBe('32px')
  })

  it('derives a different tone for different category colours', () => {
    const style = (color: string) =>
      mount(CategoryIcon, { props: { color, icon: 'eva-star-outline' } })
        .find('.category-icon')
        .attributes('style')

    expect(style('#00FF00')).not.toBe(style('#0000FF'))
  })
})
