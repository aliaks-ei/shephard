import { http, HttpResponse } from 'msw'
import type { PlanSharedUser } from 'src/api/plans'
import type { TemplateSharedUser } from 'src/api/templates'
import { getAll, getById } from 'src/mocks/data/db'
import {
  getPlanExpenseSummaryData,
  getPlanItemsWithTrackingData,
  users as seedUsers,
} from 'src/mocks/data/seed'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function getTemplateSharedUsers(templateId: string): TemplateSharedUser[] {
  return getAll('template_shares')
    .filter((share) => share.template_id === templateId)
    .map((share) => {
      const user = getById('users', share.shared_with_user_id)

      return {
        user_id: share.shared_with_user_id,
        user_name: user?.name ?? 'Unknown user',
        user_email: user?.email ?? 'unknown@example.com',
        permission_level: share.permission_level,
        shared_at: share.created_at,
      }
    })
}

function getPlanSharedUsers(planId: string): PlanSharedUser[] {
  return getAll('plan_shares')
    .filter((share) => share.plan_id === planId)
    .map((share) => {
      const user = getById('users', share.shared_with_user_id)

      return {
        user_id: share.shared_with_user_id,
        user_name: user?.name ?? 'Unknown user',
        user_email: user?.email ?? 'unknown@example.com',
        permission_level: share.permission_level,
        shared_at: share.created_at,
      }
    })
}

export const rpcHandlers = [
  // get_plan_expense_summary
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_expense_summary`, async ({ request }) => {
    const body = (await request.json()) as { p_plan_id: string }
    return HttpResponse.json(getPlanExpenseSummaryData(body.p_plan_id))
  }),

  // get_plan_items_with_tracking
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_items_with_tracking`, async ({ request }) => {
    const body = (await request.json()) as { p_plan_id: string }
    return HttpResponse.json(getPlanItemsWithTrackingData(body.p_plan_id))
  }),

  // get_plan_items_with_tracking_by_category
  http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_plan_items_with_tracking_by_category`,
    async ({ request }) => {
      const body = (await request.json()) as { p_plan_id: string; p_category_id: string }
      return HttpResponse.json(getPlanItemsWithTrackingData(body.p_plan_id, body.p_category_id))
    },
  ),

  // get_template_shared_users
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_template_shared_users`, async ({ request }) => {
    const body = (await request.json()) as { p_template_id: string }
    return HttpResponse.json(getTemplateSharedUsers(body.p_template_id))
  }),

  // get_plan_shared_users
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_shared_users`, async ({ request }) => {
    const body = (await request.json()) as { p_plan_id: string }
    return HttpResponse.json(getPlanSharedUsers(body.p_plan_id))
  }),

  // search_users_for_sharing
  http.post(`${SUPABASE_URL}/rest/v1/rpc/search_users_for_sharing`, async ({ request }) => {
    const body = (await request.json()) as { q: string; entity_id?: string; entity_type?: string }
    const query = body.q.toLowerCase()
    const sharedUserIds =
      body.entity_type === 'plan'
        ? new Set(
            getAll('plan_shares')
              .filter((share) => share.plan_id === body.entity_id)
              .map((share) => share.shared_with_user_id),
          )
        : new Set(
            getAll('template_shares')
              .filter((share) => share.template_id === body.entity_id)
              .map((share) => share.shared_with_user_id),
          )
    const results = seedUsers
      .filter(
        (u) =>
          !sharedUserIds.has(u.id) &&
          (u.email.toLowerCase().includes(query) || u.name.toLowerCase().includes(query)),
      )
      .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    return HttpResponse.json(results)
  }),
]
