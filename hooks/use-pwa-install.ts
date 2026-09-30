"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { isStandaloneDisplay } from "@/lib/display-mode"
import {
  type BeforeInstallPromptEventLike,
  getInstalledRelatedWebApps,
  isIosLikeDevice,
  isInstallNudgeOnCooldown,
  isPwaInstallHost,
  isRunningAsInstalledPwa,
  markInstallDismissed,
} from "@/lib/pwa-install"

type InstallOutcome = "accepted" | "dismissed" | "unavailable" | "manual"

type PwaInstallState = {
  /** Captured Chromium install event is ready. */
  canPrompt: boolean
  /** Already running as installed app, or related webapp detected. */
  isInstalled: boolean
  /** iPhone/iPad — no programmatic install; show Share guide. */
  needsManualInstall: boolean
  /** Show install affordances (menu / nudge). */
  isEligible: boolean
  /** Soft corner/sheet nudge (not yet dismissed, eligible, prompt or iOS). */
  showNudge: boolean
  promptInstall: () => Promise<InstallOutcome>
  dismissNudge: () => void
  openManualGuide: () => void
  manualGuideOpen: boolean
  setManualGuideOpen: (open: boolean) => void
}

let deferredPrompt: BeforeInstallPromptEventLike | null = null
let manualGuideOpen = false
let nudgeDismissed = false
const deferredListeners = new Set<() => void>()
const uiListeners = new Set<() => void>()

function notifyDeferred() {
  for (const listener of deferredListeners) listener()
}

function notifyUi() {
  for (const listener of uiListeners) listener()
}

function subscribeDeferred(listener: () => void) {
  deferredListeners.add(listener)
  return () => {
    deferredListeners.delete(listener)
  }
}

function subscribeUi(listener: () => void) {
  uiListeners.add(listener)
  return () => {
    uiListeners.delete(listener)
  }
}

function getDeferredSnapshot() {
  return deferredPrompt
}

function getManualGuideSnapshot() {
  return manualGuideOpen
}

function getNudgeDismissedSnapshot() {
  return nudgeDismissed
}

function setManualGuideOpenValue(open: boolean) {
  if (manualGuideOpen === open) return
  manualGuideOpen = open
  notifyUi()
}

function setNudgeDismissedValue(value: boolean) {
  if (nudgeDismissed === value) return
  nudgeDismissed = value
  notifyUi()
}

function ensureDeferredCapture() {
  if (typeof window === "undefined") return
  const w = window as Window & {
    __irisPwaInstallBound?: boolean
  }
  if (w.__irisPwaInstallBound) return
  w.__irisPwaInstallBound = true

  window.addEventListener("beforeinstallprompt", ((event: Event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEventLike
    notifyDeferred()
  }) as EventListener)

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null
    notifyDeferred()
  })
}

ensureDeferredCapture()

function useHostname() {
  return React.useSyncExternalStore(
    () => () => {},
    () => window.location.hostname,
    () => ""
  )
}

function usePwaInstall(): PwaInstallState {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const promptEvent = React.useSyncExternalStore(
    subscribeDeferred,
    getDeferredSnapshot,
    () => null
  )
  const guideOpen = React.useSyncExternalStore(
    subscribeUi,
    getManualGuideSnapshot,
    () => false
  )
  const dismissed = React.useSyncExternalStore(
    subscribeUi,
    getNudgeDismissedSnapshot,
    () => false
  )
  const hostname = useHostname()

  const [relatedInstalled, setRelatedInstalled] = React.useState(false)
  const hydrated = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  React.useEffect(() => {
    ensureDeferredCapture()
    if (isInstallNudgeOnCooldown()) setNudgeDismissedValue(true)

    let cancelled = false
    void getInstalledRelatedWebApps().then((apps) => {
      if (!cancelled) setRelatedInstalled(apps.length > 0)
    })
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(display-mode: standalone)")
    const onChange = () => notifyDeferred()
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])

  const onChatDesk = Boolean(hostname) && isPwaInstallHost(hostname)
  const runningInstalled = hydrated && isRunningAsInstalledPwa()
  const isInstalled = runningInstalled || relatedInstalled
  const ios = hydrated && isIosLikeDevice()
  const canPrompt = Boolean(promptEvent) && !isInstalled
  const needsManualInstall = ios && !isInstalled
  // iOS isolates Home Screen storage from Safari unless the user installs
  // while already signed in — never nudge guests to install first.
  const isEligible =
    hydrated &&
    onChatDesk &&
    !authLoading &&
    isAuthenticated &&
    !isInstalled &&
    (canPrompt || needsManualInstall)

  const showNudge =
    isEligible && !dismissed && !guideOpen && !isStandaloneDisplay()

  const promptInstall = React.useCallback(async (): Promise<InstallOutcome> => {
    if (isIosLikeDevice() && !isRunningAsInstalledPwa()) {
      setManualGuideOpenValue(true)
      return "manual"
    }

    const event = deferredPrompt
    if (!event) return "unavailable"

    try {
      await event.prompt()
      const choice = await event.userChoice
      deferredPrompt = null
      notifyDeferred()
      if (choice.outcome === "accepted") {
        setRelatedInstalled(true)
        markInstallDismissed()
        setNudgeDismissedValue(true)
      }
      return choice.outcome
    } catch {
      deferredPrompt = null
      notifyDeferred()
      return "unavailable"
    }
  }, [])

  const dismissNudge = React.useCallback(() => {
    markInstallDismissed()
    setNudgeDismissedValue(true)
  }, [])

  const openManualGuide = React.useCallback(() => {
    setManualGuideOpenValue(true)
  }, [])

  const setManualGuideOpen = React.useCallback((open: boolean) => {
    setManualGuideOpenValue(open)
  }, [])

  return {
    canPrompt,
    isInstalled,
    needsManualInstall,
    isEligible,
    showNudge,
    promptInstall,
    dismissNudge,
    openManualGuide,
    manualGuideOpen: guideOpen,
    setManualGuideOpen,
  }
}

export { usePwaInstall }
export type { InstallOutcome, PwaInstallState }
