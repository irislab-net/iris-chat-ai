"use client"

import Script from "next/script"

import { GTM_ID } from "@/lib/analytics"

declare global {
  interface Window {
    __exurBootGtm?: (id: string) => void
  }
}

type GoogleTagManagerProps = {
  enabled?: boolean
}

function GoogleTagManager({ enabled = false }: GoogleTagManagerProps) {
  if (!enabled) return null

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
