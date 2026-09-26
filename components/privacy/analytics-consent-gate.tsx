"use client"

import * as React from "react"

import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { GoogleTagManager } from "@/components/analytics/google-tag-manager"
import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner"
import {
  getConsentSnapshot,
  getServerConsentSnapshot,
  hasAnalyticsConsent,
  subscribeConsent,
} from "@/lib/consent"

/**
 * Loads GA/GTM only after explicit analytics consent.
 * Consent Mode defaults are set by /scripts/consent-defaults.js.
 */
function AnalyticsConsentGate({ children }: { children: React.ReactNode }) {
  const prefs = React.useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  )
  const analyticsAllowed = hasAnalyticsConsent(prefs)

  return (
    <>
      {children}
      <CookieConsentBanner />
      {analyticsAllowed ? (
        <>
          <GoogleTagManager />
          <GoogleAnalytics />
        </>
      ) : null}
    </>
  )
}

export { AnalyticsConsentGate }
