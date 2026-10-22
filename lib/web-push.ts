/**
 * Web Push (FCM) — shared contract with the native apps.
 *
 * Mirrors `PushRepository` / `ExurPush` in exur-mobile-app:
 * backend → device payload is a standard FCM message with BOTH blocks
 * ```
 * notification: { title: "Exur", body: "<message text>" }
 * data: { type: "chat_message", session_id: "<chat session>", message_id: "<optional>" }
 * ```
 * and the device registers its token with
 * `POST /v1/devices/push-token` `{ token, platform, provider: "fcm", app_id }`.
 *
 * The Firebase web config below is the public SDK config of the
 * `EXUR-WEB-APPLICATION` app in project `exur-main` (retrieved via the
 * Firebase MCP `firebase_get_sdk_config`). These values are not secrets;
 * every one can be overridden with `NEXT_PUBLIC_FIREBASE_*` env vars.
 * Only the VAPID key has no default: generate it in
 * Firebase Console → Project settings → Cloud Messaging → Web Push
 * certificates and set `NEXT_PUBLIC_FIREBASE_VAPID_KEY`. Without it,
 * web push stays a no-op (see `isWebPushConfigured`).
 */

export const FIREBASE_WEB_CONFIG = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyDi4byocMKJ9oklAk4RdK_2CB6446NNy0w",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "exur-main.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "exur-main",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "exur-main.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "604582580021",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:604582580021:web:18e1fc01b3832baf36867c",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-RBYHCFCEE5",
} as const

export const FIREBASE_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() ?? ""

/** Web push only runs when a VAPID key is configured. */
export function isWebPushConfigured(): boolean {
  return FIREBASE_VAPID_KEY.length > 0 && Boolean(FIREBASE_WEB_CONFIG.appId)
}

export const PUSH_TOKEN_SYNCED_KEY = "exur_push_last_synced_pair"
export const PUSH_PENDING_SESSION_KEY = "exur_push_pending_session_id"

/** Body for `POST /v1/devices/push-token` — identical shape to Android/iOS. */
export function buildPushTokenPayload(token: string) {
  return {
    token,
    platform: "web",
    provider: "fcm",
    app_id: FIREBASE_WEB_CONFIG.appId,
  } as const
}

/** `bearer|token` pair already attempted upstream (mobile PushTokenStore parity). */
export function pushSyncPair(bearer: string, token: string): string {
  return `${bearer}|${token}`
}

export type PushData = Record<string, string | undefined>

/** In-app target for a tapped push, mirroring the mobile deep link. */
export function pushTargetPath(data: PushData | undefined | null): string {
  const explicit = data?.url?.trim()
  if (explicit && explicit.startsWith("/")) return explicit
  const sessionId = (data?.session_id ?? data?.sessionId)?.trim()
  if (sessionId) return `/?session_id=${encodeURIComponent(sessionId)}`
  return "/"
}

export function pushSessionId(data: PushData | undefined | null): string | null {
  const sessionId = (data?.session_id ?? data?.sessionId)?.trim()
  return sessionId ? sessionId : null
}

/** Query string carrying the config into `firebase-messaging-sw.js`. */
export function serviceWorkerConfigQuery(): string {
  const params = new URLSearchParams({
    apiKey: FIREBASE_WEB_CONFIG.apiKey,
    authDomain: FIREBASE_WEB_CONFIG.authDomain,
    projectId: FIREBASE_WEB_CONFIG.projectId,
    storageBucket: FIREBASE_WEB_CONFIG.storageBucket,
    messagingSenderId: FIREBASE_WEB_CONFIG.messagingSenderId,
    appId: FIREBASE_WEB_CONFIG.appId,
  })
  return params.toString()
}

export function readPendingPushSession(): string | null {
  try {
    return localStorage.getItem(PUSH_PENDING_SESSION_KEY)
  } catch {
    return null
  }
}

export function storePendingPushSession(sessionId: string | null) {
  try {
    if (sessionId) localStorage.setItem(PUSH_PENDING_SESSION_KEY, sessionId)
    else localStorage.removeItem(PUSH_PENDING_SESSION_KEY)
  } catch {
    // Private mode / quota — deep link is best-effort.
  }
}
