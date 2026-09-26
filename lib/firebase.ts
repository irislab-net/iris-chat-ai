import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"
import {
  type Analytics,
  getAnalytics,
  isSupported,
  logEvent,
} from "firebase/analytics"

import { isMarketingHost, isProductionChatHost } from "@/lib/hosts"

/** Public Firebase web config — values come from NEXT_PUBLIC_* env. */
export function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ?? "",
  }
}

export function isFirebaseConfigured() {
  const config = getFirebaseConfig()
  return Boolean(config.apiKey && config.projectId && config.appId)
}

/** Apex + chat production hosts only — never local / preview / staging. */
export function isFirebaseProductionHost(hostname: string): boolean {
  return isMarketingHost(hostname) || isProductionChatHost(hostname)
}

/**
 * Firebase Analytics is production-only: built for prod, real exur hosts,
 * and a complete public config.
 */
export function isFirebaseAnalyticsEnabled(hostname?: string | null): boolean {
  if (process.env.NODE_ENV !== "production") return false
  if (!isFirebaseConfigured()) return false
  if (hostname != null && hostname !== "") {
    return isFirebaseProductionHost(hostname)
  }
  return true
}

/** Singleton Firebase app (safe to call from client or server). */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null

  if (getApps().length > 0) return getApp()

  return initializeApp(getFirebaseConfig())
}

let analyticsPromise: Promise<Analytics | null> | null = null

/**
 * Browser-only Analytics. Returns null on the server, when unsupported,
 * outside production, or when Firebase env is incomplete.
 */
export function getFirebaseAnalytics(
  hostname?: string | null
): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  if (!isFirebaseAnalyticsEnabled(hostname ?? window.location.hostname)) {
    return Promise.resolve(null)
  }

  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const supported = await isSupported()
      if (!supported) return null
      const app = getFirebaseApp()
      if (!app) return null
      return getAnalytics(app)
    })()
  }

  return analyticsPromise
}

/** SPA page view → Firebase / GA4 “Pages and screens”. */
export async function trackFirebasePageView(path: string) {
  const analytics = await getFirebaseAnalytics()
  if (!analytics) return

  logEvent(analytics, "page_view", {
    page_path: path,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  })
}
