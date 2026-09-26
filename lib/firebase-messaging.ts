import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging"

import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase"

export const FCM_TOKEN_STORAGE_KEY = "exur-fcm-token"
export const FCM_ENABLED_STORAGE_KEY = "exur-fcm-enabled"
export const FCM_SW_PATH = "/firebase-messaging-sw.js"

export function getFirebaseVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() ?? ""
}

export function isFirebaseMessagingConfigured() {
  return isFirebaseConfigured() && Boolean(getFirebaseVapidKey())
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

export function getStoredFcmToken() {
  return readStorage(FCM_TOKEN_STORAGE_KEY)
}

export function isFcmPreferenceEnabled() {
  return readStorage(FCM_ENABLED_STORAGE_KEY) === "1"
}

export function setFcmPreferenceEnabled(enabled: boolean) {
  writeStorage(FCM_ENABLED_STORAGE_KEY, enabled ? "1" : "0")
}

let messagingSingleton: Messaging | null | undefined
let messagingInit: Promise<Messaging | null> | null = null

/** Browser-only Messaging instance (null when unsupported / misconfigured). */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null
  if (!isFirebaseMessagingConfigured()) return null
  if (messagingSingleton !== undefined) return messagingSingleton
  if (messagingInit) return messagingInit

  messagingInit = (async () => {
    const supported = await isSupported()
    if (!supported) {
      messagingSingleton = null
      return null
    }
    const app = getFirebaseApp()
    if (!app) {
      messagingSingleton = null
      return null
    }
    messagingSingleton = getMessaging(app)
    return messagingSingleton
  })()

  return messagingInit
}

export class FirebaseMessagingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FirebaseMessagingError"
  }
}

async function ensureMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new FirebaseMessagingError("Service workers are not supported in this browser")
  }
  try {
    return await navigator.serviceWorker.register(FCM_SW_PATH, { scope: "/" })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error"
    throw new FirebaseMessagingError(
      `Service worker failed (${detail}). Hard-refresh after trusting the HTTPS certificate for local.exur.ai.`
    )
  }
}

/**
 * Request permission + FCM token. Throws FirebaseMessagingError on failure.
 * Stores the token locally for later backend registration.
 */
export async function enableFirebaseMessaging(): Promise<string> {
  if (typeof window === "undefined") {
    throw new FirebaseMessagingError("Notifications require a browser window")
  }
  if (!isFirebaseMessagingConfigured()) {
    throw new FirebaseMessagingError("Firebase messaging env is not configured")
  }
  if (!window.isSecureContext) {
    throw new FirebaseMessagingError("Notifications require HTTPS")
  }

  const messaging = await getFirebaseMessaging()
  if (!messaging) {
    throw new FirebaseMessagingError("Firebase messaging is not supported here")
  }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    setFcmPreferenceEnabled(false)
    writeStorage(FCM_TOKEN_STORAGE_KEY, null)
    throw new FirebaseMessagingError("Notification permission was denied")
  }

  const registration = await ensureMessagingServiceWorker()
  await navigator.serviceWorker.ready

  let token: string
  try {
    token = await getToken(messaging, {
      vapidKey: getFirebaseVapidKey(),
      serviceWorkerRegistration: registration,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error"
    throw new FirebaseMessagingError(`FCM getToken failed: ${detail}`)
  }

  if (!token) {
    setFcmPreferenceEnabled(false)
    writeStorage(FCM_TOKEN_STORAGE_KEY, null)
    throw new FirebaseMessagingError("FCM returned an empty token")
  }

  setFcmPreferenceEnabled(true)
  writeStorage(FCM_TOKEN_STORAGE_KEY, token)
  return token
}

/** Opt out: delete FCM token and clear local preference. */
export async function disableFirebaseMessaging(): Promise<void> {
  setFcmPreferenceEnabled(false)
  writeStorage(FCM_TOKEN_STORAGE_KEY, null)

  const messaging = await getFirebaseMessaging()
  if (!messaging) return
  try {
    await deleteToken(messaging)
  } catch {
    /* already deleted / SW missing */
  }
}

/** Re-register SW + refresh token when user previously opted in. */
export async function refreshFirebaseMessagingIfEnabled(): Promise<string | null> {
  if (!isFcmPreferenceEnabled()) return null
  if (typeof Notification === "undefined") return null
  if (Notification.permission !== "granted") {
    setFcmPreferenceEnabled(false)
    return null
  }
  try {
    return await enableFirebaseMessaging()
  } catch {
    return null
  }
}

export type Unsubscribe = () => void

/** Foreground messages while the tab is open. */
export async function subscribeForegroundMessages(
  handler: (payload: MessagePayload) => void
): Promise<Unsubscribe> {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return () => {}
  return onMessage(messaging, handler)
}
