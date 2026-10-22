"use client"

import * as React from "react"
import { toast } from "sonner"

import { startWebPush } from "@/lib/web-push-client"
import { pushSessionId, pushTargetPath, storePendingPushSession } from "@/lib/web-push"

/**
 * Registers the FCM web token (only when notification permission was
 * already granted — never prompts) and surfaces foreground pushes as
 * toasts, mirroring the mobile foreground notification. Mounted once
 * in the root layout; a no-op until NEXT_PUBLIC_FIREBASE_VAPID_KEY is set.
 */
export function WebPushRegistration() {
  React.useEffect(() => {
    // A tapped background push lands on /?session_id=… — park it like
    // mobile's PushDeepLink until the chat surface consumes it.
    const sessionId = new URLSearchParams(window.location.search).get("session_id")
    if (sessionId) storePendingPushSession(sessionId)

    void startWebPush((payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? "Exur"
      const body =
        payload.notification?.body ?? payload.data?.body ?? payload.data?.message
      if (!body) return
      const data = payload.data ?? {}
      toast(title, {
        description: body,
        action: pushSessionId(data)
          ? {
              label: "Open",
              onClick: () => {
                window.location.href = pushTargetPath(data)
              },
            }
          : undefined,
      })
    })
  }, [])

  return null
}
