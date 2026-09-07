import { describe, expect, it } from 'vitest'
import { useSharedPlanTransition } from './useSharedPlanTransition'

describe('useSharedPlanTransition', () => {
  it('only the marked plan carries the hero transition name', () => {
    const a = useSharedPlanTransition(() => 'plan-a')
    const b = useSharedPlanTransition(() => 'plan-b')

    a.markShared()
    expect(a.heroStyle.value).toEqual({ viewTransitionName: 'plan-hero' })
    expect(b.heroStyle.value).toBeUndefined()

    b.markShared()
    expect(a.heroStyle.value).toBeUndefined()
    expect(b.heroStyle.value).toEqual({ viewTransitionName: 'plan-hero' })
  })
})
