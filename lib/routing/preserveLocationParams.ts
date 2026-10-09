/**
 * Helpers for navigation that forward the current URL's search params and hash
 * onto a static destination path (referral / Telegram deep-link continuity).
 */

export type PreserveLocationOptions = {
  /** Forward current location's search params onto the target. Default `true`. */
  preserveSearch?: boolean
  /** Forward current location's hash onto the target. Default `true`. */
  preserveHash?: boolean
  /**
   * Whitelist of search-param keys to forward. When omitted (default),
   * every key from the current location is forwarded. The target path's own
   * search params always win on key collisions.
   */
  keys?: ReadonlyArray<string>
}

export type LocationSearchHash = {
  search: string
  hash: string
}

const PARSER_BASE = "http://router.local/"

/**
 * Build an href string that merges target ⊕ current search/hash.
 * Target wins on key conflicts.
 */
export function buildPreservedTo(
  target: string,
  current: LocationSearchHash,
  options: PreserveLocationOptions = {}
): string {
  const { preserveSearch = true, preserveHash = true, keys } = options
  let parsed: URL
  try {
    parsed = new URL(target, PARSER_BASE)
  } catch {
    return target
  }

  if (preserveSearch && current.search) {
    const fromCurrent = new URLSearchParams(
      current.search.startsWith("?") ? current.search.slice(1) : current.search
    )
    const targetParams = parsed.searchParams
    fromCurrent.forEach((value, key) => {
      if (keys && !keys.includes(key)) return
      if (targetParams.has(key)) return
      targetParams.append(key, value)
    })
  }

  if (preserveHash && current.hash && !parsed.hash) {
    parsed.hash = current.hash.startsWith("#") ? current.hash : `#${current.hash}`
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}
