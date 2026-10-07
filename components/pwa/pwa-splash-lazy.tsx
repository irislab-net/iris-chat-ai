"use client"

import dynamic from "next/dynamic"
import * as React from "react"

import { isStandaloneDisplay } from "@/lib/display-mode"

const PwaSplash = dynamic(
  () => import("@/components/pwa/pwa-splash").then((m) => m.PwaSplash),
  { ssr: false }
)

const STANDALONE_QUERY =
  "(display-mode: standalone), (display-mode: fullscreen)"

function subscribeStandalone(onStoreChange: () => void) {
  const media = window.matchMedia(STANDALONE_QUERY)
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function getStandaloneSnapshot() {
  return isStandaloneDisplay()
}

/** SSR + first client paint: never mount splash CSS on normal browser tabs. */
function getStandaloneServerSnapshot() {
  return false
}

/**
 * Only mount the splash (and its CSS) for installed PWAs.
 * Normal browser tabs skip the splash chunk entirely.
 */
export function PwaSplashLazy() {
  const standalone = React.useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  )

  if (!standalone) return null
  return <PwaSplash />
}
