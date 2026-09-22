"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

import { useIdleReady } from "@/hooks/use-idle-ready"
import { GTM_ID, isChatGtmEnabled } from "@/lib/analytics"

declare global {
  interface Window {
    __exurBootGtm?: (id: string) => void
  }
}

/** GTM is chat-only; read host on the client so the root layout stays static. */
function GoogleTagManager() {
  const pathname = usePathname() ?? "/"
  const enabled = React.useSyncExternalStore(
    () => () => {},
    () => isChatGtmEnabled(pathname, window.location.hostname),
    () => false
  )
  const idleReady = useIdleReady(enabled, 4000)

  if (!enabled || !idleReady) return null

  return (
    <>
      <Script
        id="google-tag-manager-boot"
        src="/scripts/google-tag-manager-boot.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.__exurBootGtm?.(GTM_ID)
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          title="Google Tag Manager"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  )
}

export { GoogleTagManager }
