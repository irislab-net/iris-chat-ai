"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

import { useIdleReady } from "@/hooks/use-idle-ready"
import {
  GA_MEASUREMENT_ID,
  getGaMeasurementId,
  isAnalyticsEnabled,
  isChatGtmEnabled,
  trackPageView,
} from "@/lib/analytics"
import { isMarketingHost, isProductionChatHost } from "@/lib/hosts"

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

  const isChatHost = Boolean(hostname) && isProductionChatHost(hostname)
  const gtmCoversChat =
    Boolean(hostname) &&
    !isMarketingHost(hostname) &&
    isChatGtmEnabled(pathname ?? "/", hostname)

  // Standalone gtag is marketing-only. Chat ships GA4 via GTM — never dual-load.
  const wantsGa =
    isAnalyticsEnabled() && Boolean(hostname) && !isChatHost && !gtmCoversChat

  const idleReady = useIdleReady(wantsGa, 15_000)

  // SPA navigations — initial load is covered by gtag config / GTM.
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

  if (!wantsGa || !idleReady) return null

  const measurementId = getGaMeasurementId() || GA_MEASUREMENT_ID
  if (!measurementId) return null

  // Google CDN scripts rotate content, so Subresource Integrity hashes are not viable.
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script
        id="google-analytics-boot"
        src="/scripts/google-analytics-boot.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.__exurBootGa?.(measurementId)
        }}
      />
    </>
  )
}

export { GoogleAnalytics }
