const SECRET_QUERY_KEYS = new Set([
  "apikey",
  "api_key",
  "key",
  "token",
  "secret",
  "password",
  "auth",
])

/** Redact secrets; return origin + pathname (+ redacted query). */
export function sanitizeUrl(raw: string | undefined | null): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    for (const k of [...u.searchParams.keys()]) {
      if (SECRET_QUERY_KEYS.has(k.toLowerCase())) {
        u.searchParams.set(k, "[redacted]")
      }
    }
    u.hash = ""
    return `${u.origin}${u.pathname}${u.search ? u.search : ""}`
  } catch {
    const noHash = trimmed.split("#")[0] ?? trimmed
    const base = noHash.split("?")[0] ?? noHash
    return base.length > 256 ? `${base.slice(0, 256)}…` : base
  }
}

export function hostnameFromUrl(raw: string | undefined | null): string | null {
  if (raw == null) return null
  try {
    return new URL(raw.trim()).hostname || null
  } catch {
    return null
  }
}
