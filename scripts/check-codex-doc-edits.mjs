import { appendFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const allowedPatterns = [
  /^AGENTS\.md$/,
  /^README\.md$/,
  /^agent_docs\/.+\.md$/,
]

const trackedChanges = runGitCommand([
  'diff',
  '--name-only',
  '--diff-filter=ACMRTUXB',
])
const untrackedFiles = runGitCommand(['ls-files', '--others', '--exclude-standard'])
const changedFiles = [...new Set([...trackedChanges, ...untrackedFiles])].sort()

const disallowedFiles = changedFiles.filter(
  (filePath) => !allowedPatterns.some((pattern) => pattern.test(filePath))
)

if (disallowedFiles.length > 0) {
  console.error('Codex modified files outside the allowed documentation scope:')

  for (const filePath of disallowedFiles) {
    console.error(`- ${filePath}`)
  }

  process.exit(1)
}

await writeGithubOutput('has_changes', String(changedFiles.length > 0))
await writeGithubOutput('changed_files_json', JSON.stringify(changedFiles))

function runGitCommand(args) {
  const output = execFileSync('git', args, { encoding: 'utf8' }).trim()

  if (!output) {
    return []
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

async function writeGithubOutput(name, value) {
  const githubOutputPath = process.env.GITHUB_OUTPUT

  if (!githubOutputPath) {
    return
  }

  await appendFile(githubOutputPath, `${name}=${value}\n`)
}
