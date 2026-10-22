"use client"

import * as React from "react"
import { BellIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { enableWebPush, startWebPush } from "@/lib/web-push-client"
import type { ForegroundPushHandler } from "@/lib/web-push-client"
import {
  isWebPushConfigured,
  markPushPromptDismissed,
  pushSessionId,
  pushTargetPath,
  readPushPromptDismissedAt,
  shouldShowPushPrompt,
  storePendingPushSession,
} from "@/lib/web-push"
import { cn } from "@/lib/utils"

/** Brief post-paint delay so the card never competes with first render. */
const PUSH_PROMPT_REVEAL_MS = 1200

/**
 * Web push entry point, mounted once in the root layout.
 *
 * Browsers ignore (Chrome) or forbid (Safari) a native permission prompt
 * fired without a user gesture, and an auto-dismissed prompt can get the
 * origin blocked — so on first visit this shows an in-app soft prompt
 * right away, and only the "Enable" click calls the native prompt via
 * `enableWebPush()`. If permission was already granted, it just
 * (re)registers the FCM token and surfaces foreground pushes as toasts.
 * Entirely a no-op until NEXT_PUBLIC_FIREBASE_VAPID_KEY is set.
 */
export function WebPushRegistration() {
  const t = useTranslations("workspace")
  const [showPrompt, setShowPrompt] = React.useState(false)
  const [enabling, setEnabling] = React.useState(false)

  const handleForeground = React.useCallback<ForegroundPushHandler>((payload) => {
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
  }, [])

  React.useEffect(() => {
    // A tapped background push lands on /?session_id=… — park it like
    // mobile's PushDeepLink until the chat surface consumes it.
    const sessionId = new URLSearchParams(window.location.search).get("session_id")
    if (sessionId) storePendingPushSession(sessionId)

    void startWebPush(handleForeground)

    const eligible = shouldShowPushPrompt({
      configured: isWebPushConfigured(),
      supported: "serviceWorker" in navigator && "Notification" in window,
      permission: "Notification" in window ? Notification.permission : null,
      dismissedAt: readPushPromptDismissedAt(),
    })
    if (!eligible) return
    const timer = window.setTimeout(() => setShowPrompt(true), PUSH_PROMPT_REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [handleForeground])

  if (!showPrompt) return null

  return (
    <aside
      role="dialog"
      aria-labelledby="web-push-prompt-title"
      aria-describedby="web-push-prompt-desc"
      className={cn(
        "fixed inset-e-4 bottom-4 z-55 w-[min(100%-2rem,22rem)] rounded-[1.5rem] p-5",
        "border-0 bg-white/82 shadow-[0_16px_48px_-18px_color-mix(in_oklch,var(--foreground)_16%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68",
        "dark:bg-white/10 dark:supports-[backdrop-filter]:bg-white/7"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="chat-ios26-liquid-glass relative isolate flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/55 backdrop-blur-md dark:bg-white/12">
          <BellIcon className="size-5 text-foreground" aria-hidden />
        </span>
        <p
          id="web-push-prompt-title"
          className="font-heading text-[1.25rem] font-normal tracking-tight text-foreground"
        >
          {t("pushPromptTitle")}
        </p>
      </div>
      <p
        id="web-push-prompt-desc"
        className="mt-3 text-[13px] leading-relaxed text-muted-foreground"
      >
        {t("pushPromptDescription")}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          className="h-11 w-full rounded-full"
          disabled={enabling}
          onClick={() => {
            setEnabling(true)
            void enableWebPush(handleForeground).finally(() => {
              setEnabling(false)
              setShowPrompt(false)
            })
          }}
        >
          {t("pushEnable")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full rounded-full text-sm text-muted-foreground"
          onClick={() => {
            markPushPromptDismissed()
            setShowPrompt(false)
          }}
        >
          {t("pushNotNow")}
        </Button>
      </div>
    </aside>
  )
}
