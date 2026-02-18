import { http, HttpResponse } from 'msw'
import { categories } from 'src/mocks/data/seed'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export const edgeFunctionHandlers = [
  // categorize-expense
  http.post(`${SUPABASE_URL}/functions/v1/categorize-expense`, () => {
    const foodCategory = categories.find((c) => c.id === 'cat-food')!
    return HttpResponse.json({
      success: true,
      data: {
        categoryId: foodCategory.id,
        categoryName: foodCategory.name,
        confidence: 0.85,
        reasoning: 'Mock: expense name suggests a food-related purchase.',
      },
    })
  }),

  // analyze-expense-photo
  http.post(`${SUPABASE_URL}/functions/v1/analyze-expense-photo`, () => {
    const foodCategory = categories.find((c) => c.id === 'cat-food')!
    return HttpResponse.json({
      success: true,
      data: {
        expenseName: 'Grocery receipt',
        amount: 42.5,
        categoryId: foodCategory.id,
        categoryName: foodCategory.name,
        confidence: 0.78,
        reasoning: 'Mock: detected receipt with grocery items.',
      },
    })
  }),

  // convert-currency
  http.post(`${SUPABASE_URL}/functions/v1/convert-currency`, async ({ request }) => {
    const body = (await request.json()) as { from: string; to: string; amount: number }
    const rate = 1.1
    return HttpResponse.json({
      success: true,
      data: {
        from: body.from,
        to: body.to,
        originalAmount: body.amount,
        convertedAmount: Math.round(body.amount * rate * 100) / 100,
        rate,
        timestamp: Date.now(),
      },
    })
  }),
]
