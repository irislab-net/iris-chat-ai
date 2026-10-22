"use client"

import type { MessagePayload } from "firebase/messaging"

import { getStoredAccessToken } from "@/lib/api/auth"
import { apiFetch } from "@/lib/api/client"
import { getStoredGuestToken } from "@/lib/guest-chat"
import {
  buildPushTokenPayload,
  FIREBASE_VAPID_KEY,
  FIREBASE_WEB_CONFIG,
  isWebPushConfigured,
  PUSH_TOKEN_SYNCED_KEY,
  pushSyncPair,
  serviceWorkerConfigQuery,
} from "@/lib/web-push"

/**
 * Client-only FCM wiring. Firebase is dynamically imported so the SDK
 * never enters the SSR / initial bundle, and everything is a no-op
 * until `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set (see lib/web-push.ts).
 */

function readSyncedPair(): string | null {
  try {
    return localStorage.getItem(PUSH_TOKEN_SYNCED_KEY)
  } catch {
    return null
  }
}

function writeSyncedPair(pair: string) {
  try {
    localStorage.setItem(PUSH_TOKEN_SYNCED_KEY, pair)
  } catch {
    // ignore — registration retries next visit
  }
}

async function registerPushToken(token: string) {
  const bearer = getStoredAccessToken() ?? getStoredGuestToken()
  if (!bearer || !token) return
  const pair = pushSyncPair(bearer, token)
  if (readSyncedPair() === pair) return
  try {
    await apiFetch("/v1/devices/push-token", {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}` },
      body: JSON.stringify(buildPushTokenPayload(token)),
    })
  } catch {
    // Best-effort, same as mobile: a not-yet-shipped backend endpoint
    // must not be hammered or surfaced to the user.
  }
  // Mark attempted either way; a token or identity change retries.
  writeSyncedPair(pair)
}

export type ForegroundPushHandler = (payload: MessagePayload) => void

let started = false

/**
 * If notification permission is already granted, (re)register the FCM
 * token and listen for foreground messages. Never prompts — prompting
 * only happens from a user gesture via `enableWebPush()`.
 */
export async function startWebPush(onForeground?: ForegroundPushHandler) {
  if (started || !isWebPushConfigured()) return
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
  if (typeof Notification === "undefined" || Notification.permission !== "granted")
    return
  started = true
  try {
    const [{ initializeApp, getApps }, { getMessaging, getToken, onMessage }] =
      await Promise.all([import("firebase/app"), import("firebase/messaging")])
    const app =
      getApps()[0] ?? initializeApp({ ...FIREBASE_WEB_CONFIG })
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${serviceWorkerConfigQuery()}`
    )
    const messaging = getMessaging(app)
    if (onForeground) onMessage(messaging, onForeground)
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (token) await registerPushToken(token)
  } catch {
    started = false
  }
}

/** Call from a user gesture (the soft-prompt "Enable" button). */
export async function enableWebPush(
  onForeground?: ForegroundPushHandler
): Promise<NotificationPermission | null> {
  if (!isWebPushConfigured() || typeof Notification === "undefined") return null
  const permission = await Notification.requestPermission()
  if (permission === "granted") {
    started = false
    await startWebPush(onForeground)
  }
  return permission
}
