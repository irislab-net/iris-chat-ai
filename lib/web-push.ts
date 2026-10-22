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
export const PUSH_PROMPT_DISMISS_KEY = "exur-push-prompt-dismissed"
/** Soft-prompt cooldown after "Not now" (7 days, PWA-nudge parity). */
export const PUSH_PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Show the in-app enable card only when the native prompt can still be
 * asked: configured, supported, and permission not yet decided. A denied
 * permission can only be undone in browser site settings — never re-ask.
 */
export function shouldShowPushPrompt(input: {
  configured: boolean
  supported: boolean
  permission: NotificationPermission | null
  now?: number
  dismissedAt?: number | null
  cooldownMs?: number
}): boolean {
  if (!input.configured || !input.supported) return false
  if (input.permission !== "default") return false
  const dismissedAt = input.dismissedAt ?? null
  if (dismissedAt != null) {
    const now = input.now ?? Date.now()
    if (now - dismissedAt < (input.cooldownMs ?? PUSH_PROMPT_COOLDOWN_MS))
      return false
  }
  return true
}

export function readPushPromptDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(PUSH_PROMPT_DISMISS_KEY)
    if (!raw) return null
    const at = Number(raw)
    return Number.isFinite(at) ? at : null
  } catch {
    return null
  }
}

export function markPushPromptDismissed(at = Date.now()) {
  try {
    localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, String(at))
  } catch {
    // ignore
  }
}

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
