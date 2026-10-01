/** Fallback color for categories that have no color set. */
export const DEFAULT_CATEGORY_COLOR = '#6b7280'

/** Hues near red are reserved for "over budget", so red categories move to amber. */
const RESERVED_RED_HUE = { from: 15, to: 40 }
const RED_REPLACEMENT_HUE = 75
const MAX_CATEGORY_CHROMA = 0.15

/**
 * Hue and chroma of a stored category colour in OKLCH. The CSS classes
 * `.category-tone-*` set one lightness per theme, so all categories read as one
 * family next to the brand teal. Greys keep their low chroma and stay grey.
 */
export function getCategoryTone(color: string | null | undefined): { hue: number; chroma: number } {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec((color ?? '').trim())
  if (!match?.[1]) return { hue: 0, chroma: 0 }

  const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1]
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  const chroma = Math.hypot(a, bb)
  let hue = (Math.atan2(bb, a) * 180) / Math.PI
  if (hue < 0) hue += 360

  if (chroma > 0.08 && hue >= RESERVED_RED_HUE.from && hue <= RESERVED_RED_HUE.to) {
    hue = RED_REPLACEMENT_HUE
  }

  return {
    hue: Math.round(hue),
    chroma: Math.round(Math.min(chroma, MAX_CATEGORY_CHROMA) * 1000) / 1000,
  }
}

/** Inline style that feeds `.category-tone-*` classes. */
export function getCategoryToneStyle(color: string | null | undefined): Record<string, string> {
  const { hue, chroma } = getCategoryTone(color)
  return { '--cat-h': String(hue), '--cat-c': String(chroma) }
}
