import {
  APP_FEATURE_DEFAULTS,
  createDefaultAppFeaturePrefs,
  type AppFeatureId,
  type AppFeaturePrefs,
} from "@/lib/app-features"

/** Stable env-derived snapshot (no localStorage; deploy-time only). */
const snapshot: AppFeaturePrefs = createDefaultAppFeaturePrefs()

/** Stable snapshot for `useSyncExternalStore`. */
export function getAppFeaturePrefsSnapshot(): AppFeaturePrefs {
  return snapshot
}

export function readAppFeaturePrefs(): AppFeaturePrefs {
  return snapshot
}

export function isAppFeatureVisible(id: AppFeatureId): boolean {
  return snapshot[id] ?? APP_FEATURE_DEFAULTS[id]
}

/** No-op subscribe — prefs are fixed at build/deploy from env. */
export function subscribeAppFeaturePrefs(_onStoreChange: () => void) {
  return () => {}
}
