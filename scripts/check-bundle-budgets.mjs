import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * @typedef {{
 *   regressionThresholdPercent: number
 *   regressionMinBytes: number
 *   routeChunkBudgets: Record<string, number>
 *   baselineChunkBytes: Record<string, number>
 * }} BundleBudgetConfig
 */

const projectRoot = process.cwd()
const configPath = resolve(projectRoot, 'config/bundle-budgets.json')
const distJsPath = resolve(projectRoot, 'dist/pwa/js')

/** @type {BundleBudgetConfig} */
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

/**
 * Converts output file names (`ChunkName-ab12CD34.js`) to stable logical names (`ChunkName`).
 * @param {string} fileName
 * @returns {string}
 */
function getLogicalChunkName(fileName) {
  const withoutExt = fileName.slice(0, -3)
  const withHashMatch = withoutExt.match(/^(.*)-[A-Za-z0-9_-]{8,}$/)
  return withHashMatch ? withHashMatch[1] : withoutExt
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const chunkSizes = new Map()

for (const fileName of readdirSync(distJsPath)) {
  if (!fileName.endsWith('.js')) continue

  const absolutePath = join(distJsPath, fileName)
  const size = statSync(absolutePath).size
  const chunkName = getLogicalChunkName(fileName)
  chunkSizes.set(chunkName, size)
}

const failures = []
const rows = []

for (const [chunkName, maxBytes] of Object.entries(config.routeChunkBudgets)) {
  const actualBytes = chunkSizes.get(chunkName)
  const baselineBytes = config.baselineChunkBytes[chunkName]

  if (actualBytes === undefined) {
    failures.push(
      `Missing chunk "${chunkName}" in dist output. Update budgets if chunk names changed.`,
    )
    continue
  }

  const budgetUsagePercent = (actualBytes / maxBytes) * 100
  const baselineDeltaBytes =
    typeof baselineBytes === 'number' ? actualBytes - baselineBytes : undefined
  const baselineDeltaPercent =
    typeof baselineBytes === 'number' && baselineBytes > 0
      ? (baselineDeltaBytes / baselineBytes) * 100
      : undefined

  rows.push({
    chunkName,
    actualBytes,
    maxBytes,
    budgetUsagePercent,
    baselineBytes,
    baselineDeltaBytes,
    baselineDeltaPercent,
  })

  if (actualBytes > maxBytes) {
    failures.push(
      `Chunk "${chunkName}" exceeded budget: ${formatBytes(actualBytes)} > ${formatBytes(maxBytes)}.`,
    )
  }

  if (
    typeof baselineDeltaBytes === 'number' &&
    typeof baselineDeltaPercent === 'number' &&
    baselineDeltaBytes > config.regressionMinBytes &&
    baselineDeltaPercent > config.regressionThresholdPercent
  ) {
    failures.push(
      `Regression alert for "${chunkName}": +${formatBytes(baselineDeltaBytes)} (${baselineDeltaPercent.toFixed(1)}%) vs baseline ${formatBytes(baselineBytes)}.`,
    )
  }
}

rows.sort((a, b) => b.actualBytes - a.actualBytes)

console.log('Bundle Budget Report')
for (const row of rows) {
  const baselineMessage =
    typeof row.baselineBytes === 'number'
      ? `baseline ${formatBytes(row.baselineBytes)} (${row.baselineDeltaBytes >= 0 ? '+' : ''}${formatBytes(Math.abs(row.baselineDeltaBytes))}, ${row.baselineDeltaPercent.toFixed(1)}%)`
      : 'baseline n/a'

  console.log(
    `- ${row.chunkName}: ${formatBytes(row.actualBytes)} / ${formatBytes(row.maxBytes)} (${row.budgetUsagePercent.toFixed(1)}%) | ${baselineMessage}`,
  )
}

if (failures.length > 0) {
  console.error('\nBundle budget check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('\nBundle budgets are within thresholds.')
