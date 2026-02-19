import type { ActionResult } from 'src/types'

export async function toActionResult<T>(mutateAsync: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await mutateAsync()
    return { success: true, data } as ActionResult<T>
  } catch (error) {
    return { success: false, error } as ActionResult<T>
  }
}
