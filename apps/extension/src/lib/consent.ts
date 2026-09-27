/** Extension cookie / analytics consent (localStorage on chrome-extension pages). */

export const CONSENT_STORAGE_KEY = "exur-cookie-consent"
export const CONSENT_VERSION = "v1"
export const CONSENT_CHANGED_EVENT = "exur:consent-changed"
export const CONSENT_OPEN_EVENT = "exur:open-cookie-settings"

export type ConsentPreferences = {
  version: string
  analytics: boolean
  advertising: boolean
  timestamp: number
}

export type ConsentDecision = {
  analytics: boolean
  advertising?: boolean
}

let cachedSnapshot: ConsentPreferences | null | undefined
let cachedRaw: string | null | undefined

function readRawConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch {
    return null
  }
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

export function resetConsentCache() {
  cachedRaw = undefined
  cachedSnapshot = undefined
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
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, raw)
  } catch {
    /* ignore quota */
  }
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
