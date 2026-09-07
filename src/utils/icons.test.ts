import { describe, expect, it } from 'vitest'
import { resolveIcon } from './icons'

describe('resolveIcon', () => {
  it('maps eva names onto Lucide sprite symbols', () => {
    expect(resolveIcon('eva-home-outline')).toEqual({
      icon: 'svguse:/icons/lucide-sprite.svg#house',
    })
    expect(resolveIcon('eva-trash-2-outline')).toEqual({
      icon: 'svguse:/icons/lucide-sprite.svg#trash-2',
    })
  })

  it('accepts lucide names directly', () => {
    expect(resolveIcon('lucide-wallet')).toEqual({ icon: 'svguse:/icons/lucide-sprite.svg#wallet' })
  })

  it('falls back to the default resolution for unknown names', () => {
    expect(resolveIcon('eva-not-a-real-icon-outline')).toBeUndefined()
    expect(resolveIcon('mdi-home')).toBeUndefined()
  })
})
