import {
  APP_FEATURE_DEFAULTS,
  APP_FEATURE_IDS,
  createDefaultAppFeaturePrefs,
  isAppFeatureId,
  type AppFeatureId,
  type AppFeaturePrefs,
} from "@/lib/app-features"

export const APP_FEATURE_PREFS_STORAGE_KEY = "iris-app-feature-prefs"
export const APP_FEATURE_PREFS_CHANGED_EVENT = "iris-app-feature-prefs-changed"

let prefsVersion = 0
let cachedSnapshot: AppFeaturePrefs | undefined
let cachedRaw: string | null | undefined

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function readRaw(): string | null {
  if (!canUseLocalStorage()) return null
  try {
    return localStorage.getItem(APP_FEATURE_PREFS_STORAGE_KEY)
  } catch {
    return null
  }
}

function notifyChanged() {
  prefsVersion += 1
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(APP_FEATURE_PREFS_CHANGED_EVENT))
}

export function parseAppFeaturePrefs(raw: unknown): AppFeaturePrefs {
  const next = createDefaultAppFeaturePrefs()
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return next
  }
  const record = raw as Record<string, unknown>
  for (const id of APP_FEATURE_IDS) {
    if (typeof record[id] === "boolean") next[id] = record[id]
  }
  return next
}

export function resetAppFeaturePrefsCache() {
  cachedRaw = undefined
  cachedSnapshot = undefined
}

/** Stable snapshot for `useSyncExternalStore`. */
export function getAppFeaturePrefsSnapshot(): AppFeaturePrefs {
  const raw = readRaw()
  if (raw === cachedRaw && cachedSnapshot) return cachedSnapshot
  cachedRaw = raw
  if (!raw) {
    cachedSnapshot = createDefaultAppFeaturePrefs()
    return cachedSnapshot
  }
  try {
    cachedSnapshot = parseAppFeaturePrefs(JSON.parse(raw) as unknown)
  } catch {
    cachedSnapshot = createDefaultAppFeaturePrefs()
  }
  return cachedSnapshot
}

export function readAppFeaturePrefs(): AppFeaturePrefs {
  return getAppFeaturePrefsSnapshot()
}

export function isAppFeatureVisible(id: AppFeatureId): boolean {
  return getAppFeaturePrefsSnapshot()[id] ?? APP_FEATURE_DEFAULTS[id]
}

export function writeAppFeaturePrefs(patch: Partial<AppFeaturePrefs>) {
  if (!canUseLocalStorage()) return
  const current = getAppFeaturePrefsSnapshot()
  const next: AppFeaturePrefs = { ...current }
  for (const [key, value] of Object.entries(patch)) {
    if (isAppFeatureId(key) && typeof value === "boolean") {
      next[key] = value
    }
  }
  try {
    localStorage.setItem(APP_FEATURE_PREFS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
  resetAppFeaturePrefsCache()
  notifyChanged()
}

export function setAppFeatureVisible(id: AppFeatureId, enabled: boolean) {
  writeAppFeaturePrefs({ [id]: enabled })
}

export function getAppFeaturePrefsVersion() {
  return prefsVersion
}

export function subscribeAppFeaturePrefs(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key === APP_FEATURE_PREFS_STORAGE_KEY || event.key === null) {
      resetAppFeaturePrefsCache()
      onStoreChange()
    }
  }
  const onChanged = () => {
    resetAppFeaturePrefsCache()
    onStoreChange()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(APP_FEATURE_PREFS_CHANGED_EVENT, onChanged)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(APP_FEATURE_PREFS_CHANGED_EVENT, onChanged)
  }
}
