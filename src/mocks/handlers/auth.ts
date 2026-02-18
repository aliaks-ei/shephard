import { http, HttpResponse } from 'msw'
import { mockAuthUser, MOCK_USER_ID } from 'src/mocks/data/seed'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function makeSession() {
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: 'mock-refresh-token',
    user: mockAuthUser,
  }
}

export const authHandlers = [
  // GET /auth/v1/user — return current user
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json(mockAuthUser)
  }),

  // POST /auth/v1/token — token refresh and sign-in
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json(makeSession())
  }),

  // POST /auth/v1/otp — send OTP
  http.post(`${SUPABASE_URL}/auth/v1/otp`, () => {
    return HttpResponse.json({})
  }),

  // POST /auth/v1/verify — verify OTP
  http.post(`${SUPABASE_URL}/auth/v1/verify`, () => {
    return HttpResponse.json(makeSession())
  }),

  // POST /auth/v1/logout — sign out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // PUT /auth/v1/user — update user
  http.put(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      ...mockAuthUser,
      updated_at: new Date().toISOString(),
    })
  }),

  // GET /auth/v1/session — Supabase JS client may call this
  http.get(`${SUPABASE_URL}/auth/v1/session`, () => {
    return HttpResponse.json(makeSession())
  }),

  // POST /auth/v1/signup — handle sign-up
  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      id: MOCK_USER_ID,
      ...makeSession(),
    })
  }),
]
