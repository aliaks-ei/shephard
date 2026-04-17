import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { buildCorsHeaders } from '../_shared/notification-utils.ts'

interface ConvertCurrencyRequest {
  from: string
  to: string
  amount: number
}

interface ExchangeRateAPIResponse {
  result: string
  conversion_rate: number
  conversion_result: number
  time_last_update_unix: number
  time_next_update_unix: number
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'))

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let requestBody: ConvertCurrencyRequest
    try {
      requestBody = await req.json()
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const { from, to, amount } = requestBody

    if (!from || !to || amount === undefined || amount === null) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'from, to, and amount are required',
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    const currencyCodeRegex = /^[A-Z]{3}$/
    if (!currencyCodeRegex.test(from) || !currencyCodeRegex.test(to)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid currency code',
          details: 'Currency codes must be 3 uppercase letters (e.g., USD, EUR, JPY)',
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid amount',
          details: 'Amount must be a positive number',
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    if (from === to) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            from,
            to,
            originalAmount: amount,
            convertedAmount: amount,
            rate: 1,
            timestamp: Date.now(),
          },
        }),
        { headers: corsHeaders },
      )
    }

    const apiKey = Deno.env.get('EXCHANGE_RATE_API_KEY')
    if (!apiKey) {
      console.error('EXCHANGE_RATE_API_KEY not configured')
      return new Response(
        JSON.stringify({
          error: 'Currency conversion service not configured',
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}/${amount}`

    const apiResponse = await fetch(apiUrl)

    if (!apiResponse.ok) {
      // Intentionally do not log the upstream body. ExchangeRate-API error
      // payloads can contain the account/API-key context and we already log
      // the HTTP status above for triage.
      console.error('ExchangeRate-API error: status', apiResponse.status)

      return new Response(
        JSON.stringify({
          error: 'Currency conversion failed',
          details: `API returned status ${apiResponse.status}`,
        }),
        {
          status: 502,
          headers: corsHeaders,
        },
      )
    }

    const apiData: ExchangeRateAPIResponse = await apiResponse.json()

    if (apiData.result !== 'success') {
      console.error('ExchangeRate-API unsuccessful result, code:', apiData.result)
      return new Response(
        JSON.stringify({
          error: 'Currency conversion failed',
          details: 'API returned unsuccessful result',
        }),
        {
          status: 502,
          headers: corsHeaders,
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          from,
          to,
          originalAmount: amount,
          convertedAmount: apiData.conversion_result,
          rate: apiData.conversion_rate,
          timestamp: apiData.time_last_update_unix * 1000,
        },
      }),
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error('Error in convert-currency:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
