import { computed, ref } from 'vue'

// Module-level so a list card and the detail summary card agree on which plan is
// "in flight". Only one element may carry the `plan-hero` view-transition-name at a time.
const sharedPlanId = ref<string | null>(null)

export const PLAN_HERO_TRANSITION_NAME = 'plan-hero'

export function useSharedPlanTransition(planId: () => string | null | undefined) {
  const heroStyle = computed(() => {
    const id = planId()
    return id && id === sharedPlanId.value
      ? { viewTransitionName: PLAN_HERO_TRANSITION_NAME }
      : undefined
  })

  function markShared() {
    sharedPlanId.value = planId() ?? null
  }

  return { heroStyle, markShared, sharedPlanId }
}
