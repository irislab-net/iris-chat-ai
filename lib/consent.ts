/** First-party cookie / analytics consent (Consent Mode v2). */

import {
  EXUR_CLIENT_STORAGE_MAX_AGE_SECONDS,
  readSharedJson,
  writeSharedJson,
} from "@/lib/exur-client-storage"

export const CONSENT_STORAGE_KEY = "exur-cookie-consent"
export const CONSENT_VERSION = "v1"
export const CONSENT_CHANGED_EVENT = "exur:consent-changed"
export const CONSENT_OPEN_EVENT = "exur:open-cookie-settings"

export type ConsentPreferences = {
  version: string
  analytics: boolean
  /** Reserved for future ad tags; currently always false. */
  advertising: boolean
  timestamp: number
}

export type ConsentDecision = {
  analytics: boolean
  advertising?: boolean
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer ?? []
  if (typeof window.gtag === "function") {
    window.gtag(...args)
    return
  }
  // Queue Consent Mode commands before gtag.js loads.
  window.dataLayer.push(args)
}

/** Default deny until the user opts in (call as early as possible). */
export function applyConsentDefaults() {
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  })
}

export function applyConsentUpdate(prefs: ConsentDecision) {
  const analytics = prefs.analytics ? "granted" : "denied"
  const advertising = prefs.advertising ? "granted" : "denied"
  gtag("consent", "update", {
    analytics_storage: analytics,
    ad_storage: advertising,
    ad_user_data: advertising,
    ad_personalization: advertising,
  })
}

/** Cached for useSyncExternalStore — getSnapshot must return a stable reference. */
let cachedSnapshot: ConsentPreferences | null | undefined
let cachedRaw: string | null | undefined

function readRawConsent(): string | null {
  return readSharedJson(CONSENT_STORAGE_KEY)
}

export function parseConsentRaw(raw: string | null): ConsentPreferences | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ConsentPreferences
    if (parsed.version !== CONSENT_VERSION) return null
    if (typeof parsed.analytics !== "boolean") return null
    return {
      version: parsed.version,
      analytics: parsed.analytics,
      advertising: Boolean(parsed.advertising),
      timestamp:
        typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
    }
  } catch {
    return null
  }
}

/** Synchronize the in-memory snapshot with shared storage (stable identity). */
export function getConsentSnapshot(): ConsentPreferences | null {
  const raw = readRawConsent()
  if (raw === cachedRaw) {
    return cachedSnapshot ?? null
  }
  cachedRaw = raw
  cachedSnapshot = parseConsentRaw(raw)
  return cachedSnapshot
}

export function getServerConsentSnapshot(): ConsentPreferences | null {
  return null
}

export function getStoredConsent(): ConsentPreferences | null {
  return getConsentSnapshot()
}

/** Invalidate snapshot cache (tests + external storage writes). */
export function resetConsentCache() {
  cachedRaw = undefined
  cachedSnapshot = undefined
}

export function notifyConsentChanged() {
  if (typeof window === "undefined") return
  resetConsentCache()
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT))
}

export function subscribeConsent(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
      resetConsentCache()
      onStoreChange()
    }
  }
  const onChanged = () => onStoreChange()
  window.addEventListener("storage", onStorage)
  window.addEventListener(CONSENT_CHANGED_EVENT, onChanged)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChanged)
  }
}

export function setStoredConsent(
  decision: ConsentDecision
): ConsentPreferences {
  const prefs: ConsentPreferences = {
    version: CONSENT_VERSION,
    analytics: decision.analytics,
    advertising: decision.advertising ?? false,
    timestamp: Date.now(),
  }
  const raw = JSON.stringify(prefs)
  writeSharedJson(CONSENT_STORAGE_KEY, raw, EXUR_CLIENT_STORAGE_MAX_AGE_SECONDS)
  applyConsentUpdate(prefs)
  // Cache the value we just wrote, then notify subscribers (they re-read via getSnapshot).
  cachedRaw = raw
  cachedSnapshot = prefs
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT))
  }
  return prefs
}

export function hasAnalyticsConsent(prefs: ConsentPreferences | null): boolean {
  return Boolean(prefs?.analytics)
}
