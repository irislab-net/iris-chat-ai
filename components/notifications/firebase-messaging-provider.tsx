"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  isFirebaseMessagingConfigured,
  isFcmPreferenceEnabled,
  refreshFirebaseMessagingIfEnabled,
  subscribeForegroundMessages,
} from "@/lib/firebase-messaging"

/**
 * Restores FCM when the user previously opted in, and shows toasts for
 * foreground push payloads.
 */
function FirebaseMessagingProvider({
  children,
}: {
  children: React.ReactNode
}) {
  React.useEffect(() => {
    if (!isFirebaseMessagingConfigured()) return
    if (!isFcmPreferenceEnabled()) return

    let cancelled = false
    let unsubscribe: (() => void) | undefined

    void (async () => {
      await refreshFirebaseMessagingIfEnabled()
      if (cancelled) return
      unsubscribe = await subscribeForegroundMessages((payload) => {
        const title =
          payload.notification?.title?.trim() ||
          payload.data?.title?.trim() ||
          "Exur"
        const body =
          payload.notification?.body?.trim() ||
          payload.data?.body?.trim() ||
          undefined
        toast(title, body ? { description: body } : undefined)
      })
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return children
}

export { FirebaseMessagingProvider }
