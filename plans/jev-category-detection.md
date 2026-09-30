# Jev for expense category detection

Replace the LLM step in `categorize-expense` with TypeSafe Jev. Keep OpenAI as a fallback.

## Goal

- Faster and cheaper model step for category detection.
- Output is always a valid category. No JSON parsing or index checks on the happy path.
- Real probabilities instead of a model-reported confidence number.
- OpenAI still covers Jev errors and low-confidence answers (mainly non-English names).

## Scope

- In: `supabase/functions/categorize-expense/*`, `supabase/functions/_shared/ai-utils.ts`, `supabase/functions/.env.example`.
- Out: `analyze-expense-photo` (Jev is text only), frontend, MCP service.
- Response shape to the client does not change. `src/api/ai.ts` and MSW mocks stay as they are.

## Current flow (for reference)

`supabase/functions/categorize-expense/index.ts`:

1. Rule matchers: `findExactCategoryMatch` → `findMemoryCategoryMatch` → `findCategoryNameMatch` → `findSemanticCategoryMatch`.
2. On miss: `gpt-5.6-luna` with JSON schema, then `gpt-5-nano` on non-timeout error. Shared budget `OPENAI_TIMEOUT_MS = 2500`.
3. Parse and validate with zod, map 1-based index, `confidence > 0.65` → `selected`, else `suggested`.

## New flow

Step 1 stays. Step 2 becomes:

```
rule matchers miss
  → Jev (timeout JEV_TIMEOUT_MS)
      ok, confidence >= JEV_SELECT_CONFIDENCE    → selected  (source: model)
      ok, confidence >= JEV_FALLBACK_CONFIDENCE  → suggested (source: model)
      ok, confidence <  JEV_FALLBACK_CONFIDENCE  → OpenAI fallback
      error / timeout                            → OpenAI fallback
  → OpenAI fallback (gpt-5.6-luna, existing code, timeout OPENAI_TIMEOUT_MS)
      ok    → existing outcome logic
      error → if Jev had a low-confidence answer: suggested from Jev
              else: unavailable (model_timeout | model_error)
```

Starting values. Tune them from logs after rollout:

- `JEV_MODEL = 'jev-1.13.0'` (pinned, not `jev-latest`, so thresholds stay valid)
- `JEV_TIMEOUT_MS = 1000`
- `JEV_SELECT_CONFIDENCE = 0.8`
- `JEV_FALLBACK_CONFIDENCE = 0.5`

Worst case latency: 1000 ms (Jev) + 2500 ms (OpenAI) = 3.5 s. Today it is 2.5 s. This only happens when Jev fails or is not sure.

## Decisions

- Drop the `gpt-5-nano` second fallback. Jev → `gpt-5.6-luna` is already two providers. Three is not worth the code.
- Call Jev with plain `fetch`, not `@typesafe-ai/sdk`. The SDK targets Node 20+ and pulls in EffectTS. The API is one POST.
- Option keys are `"<n>. <category name>"`. The index prefix keeps keys unique when two categories share a name.
- Use Jev's `confidence` for thresholds. It measures how concentrated the distribution is, so it is stricter than the top-option probability.

## Steps

1. Get a TypeSafe API key at https://console.typesafe.ai.
2. Add the key to local env and prod secrets:
   - `supabase/functions/.env`: `TYPESAFE_API_KEY=...`
   - `supabase/functions/.env.example`: add a commented `TYPESAFE_API_KEY=` entry next to `OPENAI_API_KEY`.
   - Prod: `supabase secrets set TYPESAFE_API_KEY=...`
3. `_shared/ai-utils.ts`: add `529` to `DEFAULT_RETRYABLE_STATUS_CODES`. Change the timeout error text in `withTimeout` from `OpenAI request timed out` to `Model request timed out`. `isTimeoutError` matches on `timed out`, so it keeps working.
4. `categorize-expense/helpers.ts`: add `buildJevCriteria`:

   ```ts
   export const buildJevCriteria = (contexts: CategoryContext[]) => {
     const keys = contexts.map((category, index) => `${index + 1}. ${category.name}`)
     const criteria = Object.fromEntries(
       contexts.map((category, index) => {
         const parts = [
           category.plannedItemNames.length > 0
             ? `Planned items: ${category.plannedItemNames.slice(0, MAX_PROMPT_PLANNED_NAMES_PER_CATEGORY).join(', ')}`
             : null,
           category.memoryNames.length > 0
             ? `Past expenses: ${category.memoryNames.slice(0, MAX_PROMPT_MEMORY_NAMES_PER_CATEGORY).join(', ')}`
             : null,
         ].filter((part): part is string => part !== null)

         return [keys[index], parts.length > 0 ? parts.join('. ') : null]
       }),
     )

     return { keys, criteria }
   }
   ```

5. `categorize-expense/helpers.ts`: add `decideJevOutcome`:

   ```ts
   export const decideJevOutcome = (confidence: number): 'selected' | 'suggested' | 'fallback' =>
     confidence >= JEV_SELECT_CONFIDENCE
       ? 'selected'
       : confidence >= JEV_FALLBACK_CONFIDENCE
         ? 'suggested'
         : 'fallback'
   ```

6. `categorize-expense/index.ts`: add the Jev call before the OpenAI block:

   ```ts
   const jevResponseSchema = z.object({
     model: z.string(),
     answers: z.object({
       category: z.object({
         choice: z.string(),
         confidence: z.number(),
         probabilities: z.record(z.number()),
       }),
     }),
   })

   const requestJevCategory = (keysCriteria: Record<string, string | null>) =>
     createResponseWithRetry({
       maxAttempts: 1,
       timeoutMs: JEV_TIMEOUT_MS,
       operation: async () => {
         const response = await fetch('https://api.typesafe.ai/v1/systemone', {
           method: 'POST',
           headers: {
             Authorization: `Bearer ${Deno.env.get('TYPESAFE_API_KEY')}`,
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             model: JEV_MODEL,
             state: { expense_name: trimmedExpenseName, ...categorizationContext },
             questions: {
               category: {
                 type: 'choice',
                 instructions: 'Which budget category does this expense belong to?',
                 criteria: keysCriteria,
               },
             },
           }),
         })

         if (!response.ok) {
           throw Object.assign(new Error(`Jev request failed with ${response.status}`), {
             status: response.status,
           })
         }

         return jevResponseSchema.parse(await response.json())
       },
     })
   ```

7. `categorize-expense/index.ts`: map the answer and route:
   - `const index = keys.indexOf(answer.choice)`. If `-1`, treat it as a Jev error.
   - `decideJevOutcome(answer.confidence)`:
     - `selected` / `suggested` → `suggestionResponse(outcome, { ..., confidence: answer.confidence, source: 'model' })`.
     - `fallback` → keep the Jev answer in a variable and continue to OpenAI.
   - On Jev throw → log with `getModelErrorMetadata` and continue to OpenAI.
8. `categorize-expense/index.ts`: simplify the OpenAI block:
   - Remove the `gpt-5-nano` branch and `modelUsed` switching.
   - On OpenAI error, return the kept Jev answer as `suggested` if there is one. Otherwise return `unavailableResponse` as today.
9. Logging: extend `expense_category_model_success` with:
   - `model` (`jev-1.13.0` or `gpt-5.6-luna`)
   - `jevConfidence` (when Jev answered)
   - `fallbackReason` (`jev_error` | `jev_timeout` | `jev_low_confidence` | none)
10. Tests in `categorize-expense/helpers.test.ts` (already in `npm run test:edge`):
    - `buildJevCriteria` makes unique keys for duplicate category names.
    - `buildJevCriteria` returns `null` criteria for a category with no planned or past items.
    - `decideJevOutcome` returns the right outcome at and around both thresholds.
11. Run `npm run test:edge`, then `supabase functions serve categorize-expense` and check by hand:
    - English name (`Uber to airport`) → Jev, no fallback.
    - Non-English name (e.g. `молоко`) → check whether it falls back.
    - Invalid `TYPESAFE_API_KEY` → falls back to OpenAI.
12. Branch, PR, CI, merge, deploy `categorize-expense`.

## After rollout

- Watch logs for 1–2 weeks: fallback rate, `jevConfidence` spread, Jev latency.
- Tune `JEV_SELECT_CONFIDENCE` and `JEV_FALLBACK_CONFIDENCE`.
- If the fallback rate is high for non-English names, keep the fallback. If it is near zero, think about removing OpenAI from this function.

## Open questions

- Rate limits: docs say 40 req/s and "adjusting dynamically". Fine for Shephard traffic, but check the account's actual limit in the console.
- Does Jev accept the `state` object with `locale` / `country` keys as useful context, or does it ignore them? Compare results with and without them in step 11.

## References

- API: https://docs.typesafe.ai/api.md
- Choice primitive: https://docs.typesafe.ai/primitives/choice.md
- Models, limits, languages: https://docs.typesafe.ai/models.md
- Confidence routing: https://docs.typesafe.ai/patterns/confidence-routing.md
