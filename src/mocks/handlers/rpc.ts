import { http, HttpResponse } from 'msw'
import {
  getPlanExpenseSummaryData,
  getPlanItemsWithTrackingData,
  templateSharedUsersData,
  planSharedUsersData,
  users,
} from 'src/mocks/data/seed'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

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
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_template_shared_users`, () => {
    return HttpResponse.json(templateSharedUsersData)
  }),

  // get_plan_shared_users
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_shared_users`, () => {
    return HttpResponse.json(planSharedUsersData)
  }),

  // search_users_for_sharing
  http.post(`${SUPABASE_URL}/rest/v1/rpc/search_users_for_sharing`, async ({ request }) => {
    const body = (await request.json()) as { q: string }
    const query = body.q.toLowerCase()
    const results = users
      .filter((u) => u.email.toLowerCase().includes(query) || u.name.toLowerCase().includes(query))
      .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    return HttpResponse.json(results)
  }),
]
