"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

import { useIdleReady } from "@/hooks/use-idle-ready"
import {
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
  isChatGtmEnabled,
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

  const isMarketing = Boolean(hostname) && isMarketingHost(hostname)
  const gtmCoversChat =
    Boolean(hostname) &&
    !isMarketing &&
    isChatGtmEnabled(pathname ?? "/", hostname)

  // Standalone gtag is marketing-only when GTM already ships GA4 on chat.
  const wantsGa =
    isAnalyticsEnabled() && Boolean(hostname) && !gtmCoversChat

  const idleReady = useIdleReady(wantsGa, isMarketing ? 5000 : 4000)

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
