"use client"

import * as React from "react"

import {
  getAppFeaturePrefsSnapshot,
  isAppFeatureVisible,
  setAppFeatureVisible,
  subscribeAppFeaturePrefs,
  writeAppFeaturePrefs,
} from "@/lib/app-feature-prefs"
import type { AppFeatureId, AppFeaturePrefs } from "@/lib/app-features"

export function useAppFeaturePrefs(): {
  prefs: AppFeaturePrefs
  isVisible: (id: AppFeatureId) => boolean
  setVisible: (id: AppFeatureId, enabled: boolean) => void
  setPrefs: (patch: Partial<AppFeaturePrefs>) => void
} {
  const prefs = React.useSyncExternalStore(
    subscribeAppFeaturePrefs,
    getAppFeaturePrefsSnapshot,
    getAppFeaturePrefsSnapshot
  )

  return {
    prefs,
    isVisible: (id) => prefs[id],
    setVisible: setAppFeatureVisible,
    setPrefs: writeAppFeaturePrefs,
  }
}

export function useAppFeatureVisible(id: AppFeatureId): boolean {
  const prefs = React.useSyncExternalStore(
    subscribeAppFeaturePrefs,
    getAppFeaturePrefsSnapshot,
    getAppFeaturePrefsSnapshot
  )
  return prefs[id] ?? isAppFeatureVisible(id)
}
