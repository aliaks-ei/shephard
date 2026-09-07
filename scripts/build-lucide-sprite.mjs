// Builds a trimmed Lucide SVG sprite containing only the icons the app maps to.
// Run with `npm run icons:build` after editing src/config/lucide-icon-map.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const map = JSON.parse(readFileSync(resolve(root, 'src/config/lucide-icon-map.json'), 'utf8'))
const iconsDir = resolve(root, 'node_modules/lucide-static/icons')
const names = [...new Set(Object.values(map))].sort()

const symbols = []
const missing = []
for (const name of names) {
  const file = resolve(iconsDir, `${name}.svg`)
  if (!existsSync(file)) {
    missing.push(name)
    continue
  }
  const svg = readFileSync(file, 'utf8')
  const inner = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
  symbols.push(`<symbol id="${name}" viewBox="0 0 24 24">${inner}</symbol>`)
}

if (missing.length > 0) {
  console.error(`Missing Lucide icons: ${missing.join(', ')}`)
  process.exit(1)
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg"><defs>${symbols.join('')}</defs></svg>\n`
writeFileSync(resolve(root, 'public/icons/lucide-sprite.svg'), sprite)
console.log(`Wrote ${symbols.length} Lucide symbols to public/icons/lucide-sprite.svg`)
