export function sanitizeRedirectPath(value: unknown, fallback = '/'): string {
  const candidate = Array.isArray(value) ? value[0] : value

  if (typeof candidate !== 'string') {
    return fallback
  }

  const path = candidate.trim()
  if (!path.startsWith('/') || path.startsWith('//')) {
    return fallback
  }

  if (path.includes('\n') || path.includes('\r')) {
    return fallback
  }

  return path
}
