/**
 * Firebase bootstrap for affiliate Firestore + staking profit listeners.
 *
 * **App Check (reCAPTCHA v3):** initialized here only — never in staking runtime planes.
 * Tokens attach to Firestore requests from this named app instance.
 *
 * **Console enforcement (manual):** App Check does nothing until enabled per product in Firebase Console:
 * - Firestore (affiliate DB + profit status paths)
 * - Cloud Storage (if used later)
 * - Cloud Functions (if used later)
 * Until enforcement is on, missing/invalid App Check does not change client behavior.
 *
 * App Check failures are non-fatal: affiliate Firestore degrades gracefully and never blocks
 * wallet / staking runtime bootstrap.
 */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"
import { getFirestore, type Firestore } from "firebase/firestore"
import { DEBUG_LOGS } from "@/config/env"
import {
  getAffiliateFirebaseWebConfig,
  getAffiliateFirestoreDatabaseId,
} from "@/constants/affiliateFirebaseConfig"
import {
  getFirebaseAppCheckDebugToken,
  getRecaptchaSiteKey,
} from "@/config/env"
import { ensureCryptoRandomUuidPolyfill } from "@/lib/safeRandomUuid"
import {
  captureStakingStructuredEvent,
  STAKING_SENTRY_EVENT,
} from "@/lib/stakingSentry"

const AFFILIATE_FIREBASE_APP_NAME = "affiliate-stats"

let db: Firestore | null = null
let affiliateFirebaseApp: FirebaseApp | null = null
let affiliateFirebaseInitFailed = false

/** Ensures `bootstrapAppCheck` runs at most once per page load (StrictMode-safe). */
let appCheckBootstrapAttempted = false
let appCheckBootstrapFailed = false

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function devFirebaseWarn(message: string, detail?: unknown): void {
  if (!(process.env.NODE_ENV !== 'production') || !DEBUG_LOGS) return
  if (detail !== undefined) {
    console.warn(message, detail)
  } else {
    console.warn(message)
  }
}

/**
 * Optional DEV debug provider — set before `initializeAppCheck`.
 * Register the printed token in Firebase Console → App Check → Manage debug tokens.
 * Never enabled in production builds (`getFirebaseAppCheckDebugToken` returns null).
 */
function applyAppCheckDebugTokenIfConfigured(): void {
  if (!DEBUG_LOGS) return
  const raw = getFirebaseAppCheckDebugToken()
  if (!raw) return
  const g = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string
  }
  if (raw === "true" || raw === "1") {
    g.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    return
  }
  g.FIREBASE_APPCHECK_DEBUG_TOKEN = raw
}

function reportAppCheckInitFailure(err: unknown, phase: string): void {
  appCheckBootstrapFailed = true
  devFirebaseWarn(`[firebase] App Check ${phase} failed (non-fatal):`, err)
  captureStakingStructuredEvent({
    event: STAKING_SENTRY_EVENT.appcheck.token_failed,
    level: "warning",
    message: `${STAKING_SENTRY_EVENT.appcheck.token_failed}:${phase}`,
    dedupeKey: `appcheck_init:${phase}`,
    contexts: {
      staking_async: {
        abandon_reason:
          err instanceof Error ? err.message : typeof err === "string" ? err : "unknown",
      },
    },
    cooldownMs: 300_000,
    oncePerSession: true,
  })
}

function bootstrapAppCheck(firebaseApp: FirebaseApp): void {
  if (!isBrowser() || appCheckBootstrapAttempted || appCheckBootstrapFailed) return
  appCheckBootstrapAttempted = true

  const siteKey = getRecaptchaSiteKey()
  if (!siteKey) {
    devFirebaseWarn(
      "[firebase] App Check skipped: VITE_RECAPTCHA_SITE_KEY is unset (Firestore works until Console enforcement is enabled)."
    )
    return
  }

  try {
    ensureCryptoRandomUuidPolyfill()
    applyAppCheckDebugTokenIfConfigured()
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (err) {
    reportAppCheckInitFailure(err, "initialize")
  }
}

function getOrCreateAffiliateFirebaseApp(): FirebaseApp | null {
  if (affiliateFirebaseInitFailed) return null
  if (affiliateFirebaseApp) return affiliateFirebaseApp

  const existing = getApps().find(a => a.name === AFFILIATE_FIREBASE_APP_NAME)
  if (existing) {
    affiliateFirebaseApp = existing
    return existing
  }

  try {
    affiliateFirebaseApp = initializeApp(
      getAffiliateFirebaseWebConfig(),
      AFFILIATE_FIREBASE_APP_NAME
    )
    return affiliateFirebaseApp
  } catch (err) {
    affiliateFirebaseInitFailed = true
    devFirebaseWarn("[firebase] Affiliate app initialization failed (non-fatal):", err)
    captureStakingStructuredEvent({
      event: STAKING_SENTRY_EVENT.firebase.init_failed,
      level: "warning",
      message: STAKING_SENTRY_EVENT.firebase.init_failed,
      dedupeKey: "affiliate_firebase_app_init",
      cooldownMs: 300_000,
      oncePerSession: true,
    })
    return null
  }
}

/** Whether affiliate Firestore is configured and the named Firebase app initialized. */
export function isAffiliateFirebaseConfigured(): boolean {
  return getOrCreateAffiliateFirebaseApp() != null
}

/** App Check failed or was skipped — Firestore may still work until Console enforcement. */
export function isAffiliateAppCheckDegraded(): boolean {
  return appCheckBootstrapFailed
}

/** Lazily initialized Firestore for the named affiliate database (full SDK for realtime listeners). */
export function getAffiliateFirestore(): Firestore | null {
  if (db) return db
  const firebaseApp = getOrCreateAffiliateFirebaseApp()
  if (!firebaseApp) return null

  try {
    bootstrapAppCheck(firebaseApp)
    const databaseId = getAffiliateFirestoreDatabaseId()
    db = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp)
    return db
  } catch (err) {
    devFirebaseWarn("[firebase] Firestore initialization failed (non-fatal):", err)
    captureStakingStructuredEvent({
      event: STAKING_SENTRY_EVENT.firebase.init_failed,
      level: "warning",
      message: `${STAKING_SENTRY_EVENT.firebase.init_failed}:firestore`,
      dedupeKey: "affiliate_firestore_init",
      cooldownMs: 300_000,
      oncePerSession: true,
    })
    return null
  }
}
