/**
 * Coordinates mobile / WebView lifecycle signals so Radix Dialog and tx state
 * are not torn down during wallet deep-link handoff, BFCache restore, or
 * brief visibility transitions.
 *
 * Subscribers re-render when handoff / visibility flags change.
 */

import { stakingLifecycleTrace } from "@/staking/diagnostics/stakingLifecycleInstrumentation"

export type StakingMobileResumeSnapshot = {
  visibilityState: DocumentVisibilityState
  /** True while tab is hidden or shortly after return (stabilization). */
  suppressRadixTxDialogSyntheticClose: boolean
  /** True when page was restored from BFCache (pageshow.persisted). */
  restoredFromBfCache: boolean
}

const STABILIZE_AFTER_VISIBLE_MS = 1_400
const HANDOFF_TAIL_MS = 90_000

let visibilityState: DocumentVisibilityState =
  typeof document !== "undefined" ? document.visibilityState : "visible"

let suppressUntil = 0
let restoredFromBfCache = false
/** Short window after `pageshow.persisted` for hydrate / runner guards. */
let bfcacheRestoreUntilMs = 0
/** True while the host is likely in wallet handoff (hidden / pagehide). */
let walletHandoffLikely = false
const listeners = new Set<() => void>()

/** Cached for `getSnapshot` — must be referentially stable when fields are unchanged (e.g. `useSyncExternalStore`). */
let cachedSnapshot: StakingMobileResumeSnapshot | null = null

function now() {
  return Date.now()
}

function bumpSuppress(reason: string, until: number) {
  const t = Math.max(suppressUntil, until)
  if (t !== suppressUntil) {
    suppressUntil = t
    stakingLifecycleTrace("resume", "suppress_window", { reason, until: t })
  }
  listeners.forEach(l => l())
}

function computeSuppress(): boolean {
  const n = now()
  if (visibilityState === "hidden") return true
  if (n < suppressUntil) return true
  return false
}

function getSnapshot(): StakingMobileResumeSnapshot {
  const suppress = computeSuppress()
  if (
    cachedSnapshot &&
    cachedSnapshot.visibilityState === visibilityState &&
    cachedSnapshot.suppressRadixTxDialogSyntheticClose === suppress &&
    cachedSnapshot.restoredFromBfCache === restoredFromBfCache
  ) {
    return cachedSnapshot
  }
  cachedSnapshot = {
    visibilityState,
    suppressRadixTxDialogSyntheticClose: suppress,
    restoredFromBfCache,
  }
  return cachedSnapshot
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

let installed = false

function installGlobalListeners() {
  if (installed || typeof document === "undefined") return
  installed = true

  const onVis = () => {
    visibilityState = document.visibilityState
    stakingLifecycleTrace("resume", "visibilitychange", {
      visibilityState,
    })
    if (visibilityState === "hidden") {
      walletHandoffLikely = true
      bumpSuppress("visibility_hidden", now() + HANDOFF_TAIL_MS)
    } else {
      walletHandoffLikely = false
      bumpSuppress(
        "visibility_visible_stabilize",
        now() + STABILIZE_AFTER_VISIBLE_MS
      )
    }
  }

  const onPageHide = (e: PageTransitionEvent) => {
    walletHandoffLikely = true
    stakingLifecycleTrace("resume", "pagehide", { persisted: e.persisted })
    bumpSuppress("pagehide", now() + HANDOFF_TAIL_MS)
  }

  const onPageShow = (e: PageTransitionEvent) => {
    restoredFromBfCache = e.persisted === true
    if (e.persisted) {
      bfcacheRestoreUntilMs = now() + 5_000
    }
    walletHandoffLikely = false
    stakingLifecycleTrace("resume", "pageshow", { persisted: e.persisted })
    bumpSuppress("pageshow", now() + STABILIZE_AFTER_VISIBLE_MS)
    if (restoredFromBfCache) {
      queueMicrotask(() => {
        restoredFromBfCache = false
        listeners.forEach(l => l())
      })
    }
  }

  const onFreeze = () => {
    stakingLifecycleTrace("resume", "freeze", {})
    bumpSuppress("freeze", now() + HANDOFF_TAIL_MS)
  }

  const onResume = () => {
    stakingLifecycleTrace("resume", "resume", {})
    bumpSuppress("document_resume", now() + STABILIZE_AFTER_VISIBLE_MS)
  }

  document.addEventListener("visibilitychange", onVis)
  window.addEventListener("pagehide", onPageHide)
  window.addEventListener("pageshow", onPageShow)

  if ("onfreeze" in document) {
    document.addEventListener("freeze", onFreeze)
  }
  if ("onresume" in document) {
    document.addEventListener("resume", onResume as EventListener)
  }

  visibilityState = document.visibilityState
}

export function isRecentBfCacheRestore(): boolean {
  return Date.now() < bfcacheRestoreUntilMs
}

export function isWalletHandoffLikely(): boolean {
  return walletHandoffLikely
}

export const stakingMobileResumeStore = {
  subscribe,
  getSnapshot,
  install: installGlobalListeners,
}
