"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

import {
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics"

declare global {
  interface Window {
    __exurBootGa?: (id: string) => void
  }
}

function GoogleAnalytics() {
  const pathname = usePathname()
  const initialPath = React.useRef<string | null>(null)

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

  if (!isAnalyticsEnabled()) return null

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
