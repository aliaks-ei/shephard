import { readFile, writeFile, appendFile } from 'node:fs/promises'

const [, , inputPath, outputPath] = process.argv

if (!inputPath || !outputPath) {
  console.error(
    'Usage: node scripts/render-codex-doc-review-comment.mjs <codex-output> <comment-output>'
  )
  process.exit(1)
}

const allowedDecisions = new Set([
  'no-doc-update',
  'doc-update-recommended',
  'doc-update-required',
])

const rawOutput = await readFile(inputPath, 'utf8')
const parsed = parseCodexJson(rawOutput)

if (!allowedDecisions.has(parsed.decision)) {
  throw new Error(`Unexpected decision: ${parsed.decision}`)
}

const targets = normalizeStringList(parsed.targets)
const reasoning = normalizeStringList(parsed.reasoning)
const proposedEdits = normalizeStringList(parsed.proposed_edits)
const confidence = normalizeConfidence(parsed.confidence)
const hasUpdate = parsed.decision !== 'no-doc-update'

const lines = [
  '<!-- codex-doc-review -->',
  '## Codex Docs Review',
  '',
  `Decision: \`${parsed.decision}\``,
  '',
]

if (targets.length > 0) {
  lines.push('Targets:', ...targets.map((target) => `- \`${target}\``), '')
}

if (reasoning.length > 0) {
  lines.push('Reasoning:', ...reasoning.map((item) => `- ${item}`), '')
}

if (proposedEdits.length > 0) {
  lines.push(
    'Suggested updates:',
    ...proposedEdits.map((item) => `- ${item}`),
    ''
  )
}

lines.push(`Confidence: ${confidence.toFixed(2)}`)

await writeFile(outputPath, `${lines.join('\n')}\n`)

await writeGithubOutput('decision', parsed.decision)
await writeGithubOutput('has_update', String(hasUpdate))
await writeGithubOutput('targets_json', JSON.stringify(targets))
await writeGithubOutput('confidence', confidence.toFixed(2))

function parseCodexJson(rawText) {
  const trimmed = rawText.trim()
  const candidates = [trimmed]

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    candidates.push(fencedMatch[1].trim())
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1))
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      continue
    }
  }

  throw new Error(
    'Codex review output was not valid JSON. Update the prompt or inspect the raw output artifact.'
  )
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
}

function normalizeConfidence(value) {
  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return 0
  }

  return Math.max(0, Math.min(1, numericValue))
}

async function writeGithubOutput(name, value) {
  const githubOutputPath = process.env.GITHUB_OUTPUT

  if (!githubOutputPath) {
    return
  }

  await appendFile(githubOutputPath, `${name}=${value}\n`)
}
