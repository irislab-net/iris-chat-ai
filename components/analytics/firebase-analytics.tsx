"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import {
  getFirebaseAnalytics,
  isFirebaseAnalyticsEnabled,
  trackFirebasePageView,
} from "@/lib/firebase"
import { useIdleReady } from "@/hooks/use-idle-ready"

function useHostname() {
  return React.useSyncExternalStore(
    () => () => {},
    () => window.location.hostname,
    () => ""
  )
}

/**
 * Boots Firebase Analytics after consent (parent gate) and idle time.
 * Production hosts only (exur.ai / chat.exur.ai) — never local or preview.
 * Logs page_view on SPA navigations for “Pages and screens” in Firebase.
 */
function FirebaseAnalytics() {
  const pathname = usePathname()
  const hostname = useHostname()
  const enabled =
    Boolean(hostname) && isFirebaseAnalyticsEnabled(hostname)
  const idleReady = useIdleReady(enabled, 15_000)

  React.useEffect(() => {
    if (!enabled || !idleReady || !pathname) return

    let cancelled = false
    void (async () => {
      const analytics = await getFirebaseAnalytics(hostname)
      if (cancelled || !analytics) return
      await trackFirebasePageView(pathname)
    })()

    return () => {
      cancelled = true
    }
  }, [pathname, enabled, idleReady, hostname])

  return null
}

export { FirebaseAnalytics }
