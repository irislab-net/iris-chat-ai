"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

import { GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics"

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

  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: true,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  )
}

export { GoogleAnalytics }
