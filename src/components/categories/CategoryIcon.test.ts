import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryIcon from './CategoryIcon.vue'
import { QAvatar, QIcon } from 'quasar'

describe('CategoryIcon', () => {
  it('renders with default small size', () => {
    const wrapper = mount(CategoryIcon, {
      props: {
        color: '#FF5722',
        icon: 'eva-home-outline',
      },
      global: {
        components: {
          QAvatar,
          QIcon,
        },
      },
    })

    const avatar = wrapper.findComponent(QAvatar)
    expect(avatar.exists()).toBe(true)
    expect(avatar.props('size')).toBe('32px')
    expect(avatar.props('textColor')).toBe('white')
    expect(avatar.attributes('style')).toContain('background-color: rgb(255, 87, 34)')

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
      global: {
        components: {
          QAvatar,
          QIcon,
        },
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
      global: {
        components: {
          QAvatar,
          QIcon,
        },
      },
    })

    const avatar = wrapper.findComponent(QAvatar)
    expect(avatar.props('size')).toBe('64px')

    const icon = wrapper.findComponent(QIcon)
    expect(icon.props('size')).toBe('32px')
  })

  it('applies correct background color', () => {
    const testCases = [
      { color: '#FF0000', expectedRgb: 'rgb(255, 0, 0)' },
      { color: '#00FF00', expectedRgb: 'rgb(0, 255, 0)' },
      { color: '#0000FF', expectedRgb: 'rgb(0, 0, 255)' },
    ]

    testCases.forEach(({ color, expectedRgb }) => {
      const wrapper = mount(CategoryIcon, {
        props: {
          color,
          icon: 'eva-star-outline',
        },
        global: {
          components: {
            QAvatar,
            QIcon,
          },
        },
      })

      const avatar = wrapper.findComponent(QAvatar)
      expect(avatar.attributes('style')).toContain(`background-color: ${expectedRgb}`)
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
        global: {
          components: {
            QAvatar,
            QIcon,
          },
        },
      })

      const icon = wrapper.findComponent(QIcon)
      expect(icon.props('name')).toBe(iconName)
    })
  })
})
