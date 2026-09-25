"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

import { useIdleReady } from "@/hooks/use-idle-ready"
import { GTM_ID, getGtmId, isChatGtmEnabled } from "@/lib/analytics"

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
  const idleReady = useIdleReady(enabled, 15_000)

  if (!enabled || !idleReady) return null

  const containerId = getGtmId() || GTM_ID
  if (!containerId) return null

  return (
    <>
      <Script
        id="google-tag-manager-boot"
        src="/scripts/google-tag-manager-boot.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.__exurBootGtm?.(containerId)
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
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
