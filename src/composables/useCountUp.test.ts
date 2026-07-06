import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref, nextTick, effectScope } from 'vue'
import { useCountUp } from './useCountUp'

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches })),
  )
}

describe('useCountUp', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('initializes with the target value', () => {
    stubMatchMedia(false)

    const scope = effectScope()
    scope.run(() => {
      const target = ref(120)
      const { displayValue } = useCountUp(target)
      expect(displayValue.value).toBe(120)
    })
    scope.stop()
  })

  it('renders the target instantly when the user prefers reduced motion', async () => {
    stubMatchMedia(true)

    const scope = effectScope()
    await scope.run(async () => {
      const target = ref(0)
      const { displayValue } = useCountUp(target)

      target.value = 250
      await nextTick()

      expect(displayValue.value).toBe(250)
    })
    scope.stop()
  })

  it('renders the target instantly when animations are disabled', async () => {
    stubMatchMedia(false)

    const scope = effectScope()
    await scope.run(async () => {
      const target = ref(0)
      const { displayValue } = useCountUp(target, { enabled: false })

      target.value = 99
      await nextTick()

      expect(displayValue.value).toBe(99)
    })
    scope.stop()
  })
})
