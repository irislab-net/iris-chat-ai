import { isStakingReferralEnabled } from "@/config/env"
import {
  REFERRAL_QUERY_KEYS,
  REFERRAL_STORAGE_KEY,
} from "@/constants/stakingVaultConfig"
import { normalizeStakingReferralAddress } from "@/lib/stakingReferralAddress"

/** Same storage read as `useStakingVault` deposit affiliate branching — shared for gas estimation keys. */
export function readStoredReferral(): string | null {
  if (!isStakingReferralEnabled()) return null
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY)
    return normalizeStakingReferralAddress(raw)
  } catch {
    return null
  }
}

type SearchSource = string | URLSearchParams | URL | null | undefined

function paramsFromSource(source: SearchSource): URLSearchParams | null {
  if (source == null) return null
  if (typeof source === "string") {
    return new URLSearchParams(source)
  }
  if (source instanceof URL) {
    return source.searchParams
  }
  return source
}

/**
 * Resolve a referral best-first: explicit search source > localStorage.
 *
 * Use this when building a destination URL that must carry the referral
 * across a browser-switching handoff (Telegram → MetaMask / external).
 * The "URL wins" precedence matters: a fresh visitor link should override
 * a stale stored value on the source side.
 */
export function readActiveStakingReferral(
  searchSource?: SearchSource
): string | null {
  if (!isStakingReferralEnabled()) return null
  const params = paramsFromSource(searchSource)
  if (params) {
    for (const key of REFERRAL_QUERY_KEYS) {
      const v = params.get(key)
      const norm = normalizeStakingReferralAddress(v)
      if (norm) return norm
    }
  }
  return readStoredReferral()
}

/**
 * Return a clone of `url` with `?ref=<storedAddress>` appended IF and ONLY IF:
 *   1. The url does not already carry one of `REFERRAL_QUERY_KEYS`.
 *   2. A referral is available (from search source if provided, else storage).
 *
 * Pure: never mutates the input. Returns a fresh `URL` either way.
 *
 * Intended for the deep-link / external-browser escalation builder so the
 * referral propagates across browser scopes that don't share `localStorage`
 * (e.g. Telegram WebView → MetaMask in-app browser → standalone Safari).
 */
export function withActiveStakingReferralOnUrl(
  url: URL,
  searchSource?: SearchSource
): URL {
  const cloned = new URL(url.toString())
  for (const key of REFERRAL_QUERY_KEYS) {
    if (cloned.searchParams.has(key)) return cloned
  }
  const active = readActiveStakingReferral(searchSource)
  if (!active) return cloned
  cloned.searchParams.set("ref", active)
  return cloned
}
