import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import CategoryIcon from './CategoryIcon.vue'
import { QAvatar, QIcon } from 'quasar'

installQuasarPlugin()

describe('CategoryIcon', () => {
  it('renders with default small size', () => {
    const wrapper = mount(CategoryIcon, {
      props: {
        color: '#FF5722',
        icon: 'eva-home-outline',
      },
    })

    const avatar = wrapper.findComponent(QAvatar)
    expect(avatar.exists()).toBe(true)
    expect(avatar.props('size')).toBe('32px')
    expect(avatar.props('textColor')).toBe('white')
    expect(avatar.attributes('style')).toContain('background-color: #FF5722')

    const icon = wrapper.findComponent(QIcon)
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('eva-home-outline')
    expect(icon.props('size')).toBe('16px')
  })

  it('renders with medium size', () => {
    const wrapper = mount(CategoryIcon, {
      props: {
        color: '#4CAF50',
        icon: 'eva-shopping-cart-outline',
        size: 'md',
      },
    })

    const avatar = wrapper.findComponent(QAvatar)
    expect(avatar.props('size')).toBe('48px')

    const icon = wrapper.findComponent(QIcon)
    expect(icon.props('size')).toBe('24px')
  })

  it('renders with large size', () => {
    const wrapper = mount(CategoryIcon, {
      props: {
        color: '#2196F3',
        icon: 'eva-heart-outline',
        size: 'lg',
      },
    })

    const avatar = wrapper.findComponent(QAvatar)
    expect(avatar.props('size')).toBe('64px')

    const icon = wrapper.findComponent(QIcon)
    expect(icon.props('size')).toBe('32px')
  })

  it('applies correct background color', () => {
    const testCases = [{ color: '#FF0000' }, { color: '#00FF00' }, { color: '#0000FF' }]

    testCases.forEach(({ color }) => {
      const wrapper = mount(CategoryIcon, {
        props: {
          color,
          icon: 'eva-star-outline',
        },
      })

      const avatar = wrapper.findComponent(QAvatar)
      expect(avatar.attributes('style')).toContain(`background-color: ${color}`)
    })
  })

  it('renders different icons correctly', () => {
    const icons = ['eva-home-outline', 'eva-shopping-cart-outline', 'eva-heart-outline']

    icons.forEach((iconName) => {
      const wrapper = mount(CategoryIcon, {
        props: {
          color: '#FF5722',
          icon: iconName,
        },
      })

      const icon = wrapper.findComponent(QIcon)
      expect(icon.props('name')).toBe(iconName)
    })
  })
})
