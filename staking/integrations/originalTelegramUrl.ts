import { REFERRAL_QUERY_KEYS } from "@/constants/stakingVaultConfig"

/**
 * Session + localStorage key for the full absolute URL captured inside the
 * Telegram in-app browser on staking funnel routes. Used so "Copy link" and
 * optional `Telegram.WebApp.openLink` always use the real loaded URL (plus
 * carried-forward referral/hash) rather than a later stripped `location`.
 */
export const STAKING_ORIGINAL_TELEGRAM_URL_KEY = "staking_original_telegram_url"

export function isStakingFunnelPathname(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/"
  if (p === "/") return true
  if (p === "/staking" || p === "/app") return true
  return /\/(staking|app)$/.test(p)
}

function readSession(): string | null {
  try {
    return sessionStorage.getItem(STAKING_ORIGINAL_TELEGRAM_URL_KEY)
  } catch {
    return null
  }
}

function readLocal(): string | null {
  try {
    return localStorage.getItem(STAKING_ORIGINAL_TELEGRAM_URL_KEY)
  } catch {
    return null
  }
}

/** Prefer session (tab-scoped); fall back to localStorage. */
export function readStakingOriginalTelegramUrl(): string | null {
  return readSession() ?? readLocal()
}

export function writeStakingOriginalTelegramUrl(absoluteUrl: string): void {
  try {
    sessionStorage.setItem(STAKING_ORIGINAL_TELEGRAM_URL_KEY, absoluteUrl)
  } catch {
    /* quota / private mode */
  }
  try {
    localStorage.setItem(STAKING_ORIGINAL_TELEGRAM_URL_KEY, absoluteUrl)
  } catch {
    /* quota / private mode */
  }
}

function mergeReferralParamsAndHashFromDonor(
  target: URL,
  donor: URL | null
): void {
  if (!donor) return
  for (const key of REFERRAL_QUERY_KEYS) {
    if (!target.searchParams.has(key)) {
      const v = donor.searchParams.get(key)
      if (v) target.searchParams.set(key, v)
    }
  }
  if (!target.hash && donor.hash) {
    target.hash = donor.hash
  }
}

/**
 * Reads `win.location.href`, persists a merged absolute URL for staking
 * funnel routes (same origin only), and returns the stored value.
 *
 * When the live URL drops `ref` / `affiliate` or hash (e.g. after an internal
 * navigation), values from the last stored snapshot are reapplied so the
 * preserved link stays at least as complete as the best URL seen this session.
 *
 * When the user is not on a staking funnel path, storage is left unchanged.
 */
export function refreshStakingTelegramOriginalUrlCapture(): string | null {
  if (typeof window === "undefined") return null
  const hrefNow = window.location.href
  if (!hrefNow) {
    return readStakingOriginalTelegramUrl()
  }

  let current: URL
  try {
    current = new URL(hrefNow)
  } catch {
    return readStakingOriginalTelegramUrl()
  }

  if (!isStakingFunnelPathname(current.pathname)) {
    return readStakingOriginalTelegramUrl()
  }

  let donor: URL | null = null
  const prior = readStakingOriginalTelegramUrl()
  if (prior) {
    try {
      const u = new URL(prior)
      if (u.origin === current.origin) donor = u
    } catch {
      donor = null
    }
  }

  const merged = new URL(current.href)
  mergeReferralParamsAndHashFromDonor(merged, donor)

  const href = merged.href
  writeStakingOriginalTelegramUrl(href)
  return href
}
