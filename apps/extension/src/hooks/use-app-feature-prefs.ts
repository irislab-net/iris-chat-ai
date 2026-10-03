"use client"

import * as React from "react"

import {
  getAppFeaturePrefsSnapshot,
  isAppFeatureVisible,
  subscribeAppFeaturePrefs,
} from "@/lib/app-feature-prefs"
import type { AppFeatureId, AppFeaturePrefs } from "@/lib/app-features"

export function useAppFeaturePrefs(): {
  prefs: AppFeaturePrefs
  isVisible: (id: AppFeatureId) => boolean
} {
  const prefs = React.useSyncExternalStore(
    subscribeAppFeaturePrefs,
    getAppFeaturePrefsSnapshot,
    getAppFeaturePrefsSnapshot
  )

  return {
    prefs,
    isVisible: (id) => prefs[id],
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
