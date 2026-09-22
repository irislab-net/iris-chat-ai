"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

import {
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics"
import { isMarketingHost } from "@/lib/hosts"

declare global {
  interface Window {
    __exurBootGa?: (id: string) => void
  }
}

function useHostname() {
  return React.useSyncExternalStore(
    () => () => {},
    () => window.location.hostname,
    () => ""
  )
}

function GoogleAnalytics() {
  const pathname = usePathname()
  const hostname = useHostname()
  const initialPath = React.useRef<string | null>(null)
  const [idleReady, setIdleReady] = React.useState(false)

  const isMarketing = Boolean(hostname) && isMarketingHost(hostname)

  // SPA navigations — initial load is covered by gtag config.
  React.useEffect(() => {
    if (!pathname) return
    if (initialPath.current === null) {
      initialPath.current = pathname
      return
    }
    if (pathname === initialPath.current) return
    initialPath.current = pathname
    trackPageView(pathname)
  }, [pathname])

  // Marketing only: wait for idle so GA does not compete with LCP/TBT.
  React.useEffect(() => {
    if (!isAnalyticsEnabled() || !isMarketing) return

    const idle = window.requestIdleCallback
    if (typeof idle === "function") {
      const handle = idle(() => setIdleReady(true), { timeout: 5000 })
      return () => window.cancelIdleCallback(handle)
    }
    const handle = window.setTimeout(() => setIdleReady(true), 2500)
    return () => window.clearTimeout(handle)
  }, [isMarketing])

  const boot =
    isAnalyticsEnabled() &&
    Boolean(hostname) &&
    (!isMarketing || idleReady)

  if (!boot) return null

  // Google CDN scripts rotate content, so Subresource Integrity hashes are not viable.
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script
        id="google-analytics-boot"
        src="/scripts/google-analytics-boot.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.__exurBootGa?.(GA_MEASUREMENT_ID)
        }}
      />
    </>
  )
}

export { GoogleAnalytics }
