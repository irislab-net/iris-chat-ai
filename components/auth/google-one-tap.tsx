"use client"

import { usePathname } from "next/navigation"
import * as React from "react"
import { useTheme } from "@wrksz/themes/client/use-theme"

import {
  getGoogleClientId,
  isGoogleOneTapAutoPromptAllowed,
  isGoogleOneTapConfigured,
} from "@/lib/api/config"
import {
  syncDocumentColorScheme,
  type BrowserChromeTheme,
} from "@/lib/browser-chrome"
import { useIdleReady } from "@/hooks/use-idle-ready"
import {
  cancelGoogleOneTap,
  isGoogleOneTapDismissed,
  loadGoogleIdentityScript,
  markGoogleOneTapDismissed,
} from "@/lib/google-one-tap"

type GoogleOneTapProps = {
  enabled: boolean
  onCredential: (credential: string) => void
}

function isAuthRoute(pathname: string) {
  const normalized = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/"
  return normalized.startsWith("/auth/")
}

function resolveGoogleOneTapColorScheme(
  resolvedTheme: string | undefined
): BrowserChromeTheme {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  }
  if (resolvedTheme === "dark") return "dark"
  return "light"
}

function handlePromptMoment(notification: GooglePromptMomentNotification) {
  // Prefer not to re-prompt after hard FedCM/GIS failures (NetworkError, bad origin).
  if (notification.isNotDisplayed?.()) {
    const reason = notification.getNotDisplayedReason?.()
    if (
      reason === "unregistered_origin" ||
      reason === "invalid_client" ||
      reason === "suppressed_by_user" ||
      reason === "opt_out_or_no_session"
    ) {
      markGoogleOneTapDismissed()
    }
    return
  }
  if (notification.isSkippedMoment?.()) {
    if (notification.getSkippedReason?.() === "issuing_failed") {
      markGoogleOneTapDismissed()
    }
    return
  }
  // FedCM often omits skip reasons; only mark dismiss on explicit user close.
  if (notification.isDismissedMoment()) {
    const reason = notification.getDismissedReason()
    if (reason === "credential_returned") return
    if (reason === "cancel_called") return
    markGoogleOneTapDismissed()
  }
}

function runGoogleOneTapPrompt(
  clientId: string,
  colorScheme: BrowserChromeTheme,
  onCredential: (credential: string) => void
) {
  if (!window.google?.accounts?.id) return

  syncDocumentColorScheme(colorScheme)

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      const credential = response.credential?.trim()
      if (!credential) return
      onCredential(credential)
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    color_scheme: colorScheme,
    context: "signin",
    itp_support: true,
    // FedCM is required in current Chrome; keep it explicit.
    use_fedcm_for_prompt: true,
  })

  window.google.accounts.id.prompt(handlePromptMoment)
}

export function GoogleOneTap({ enabled, onCredential }: GoogleOneTapProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const clientId = getGoogleClientId()
  const onCredentialRef = React.useRef(onCredential)
  const promptedRef = React.useRef(false)
  const activePromptRef = React.useRef(false)
  const loadGenerationRef = React.useRef(0)

  React.useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  const shouldRun =
    enabled &&
    isGoogleOneTapConfigured() &&
    isGoogleOneTapAutoPromptAllowed() &&
    !isAuthRoute(pathname) &&
    !isGoogleOneTapDismissed()

  const colorScheme = resolveGoogleOneTapColorScheme(resolvedTheme)
  const themeReady = resolvedTheme === "light" || resolvedTheme === "dark"
  // Keep ~100KB GIS off the chat critical path (Lighthouse unused-JS / TBT).
  const deferReady = useIdleReady(
    Boolean(shouldRun && clientId && themeReady),
    15_000
  )

  const dismissActivePrompt = React.useCallback(() => {
    if (!activePromptRef.current) return
    activePromptRef.current = false
    cancelGoogleOneTap()
  }, [])

  React.useEffect(() => {
    if (!shouldRun || !clientId || !themeReady || !deferReady) return
    if (promptedRef.current) return

    const generation = ++loadGenerationRef.current
    const scheme = resolveGoogleOneTapColorScheme(resolvedTheme)

    void loadGoogleIdentityScript()
      .then(() => {
        // Stale load after disable / Strict Mode remount — do not prompt or cancel.
        if (generation !== loadGenerationRef.current) return
        if (!shouldRun || promptedRef.current || isGoogleOneTapDismissed())
          return

        promptedRef.current = true
        activePromptRef.current = true
        runGoogleOneTapPrompt(clientId, scheme, (credential) => {
          activePromptRef.current = false
          onCredentialRef.current(credential)
        })
      })
      .catch(() => {
        // GIS blocked or failed to load — fall back to manual Google sign-in.
      })

    return () => {
      // Invalidate in-flight script loads without calling cancel() — canceling an
      // active FedCM request logs AbortError in GSI_LOGGER (React Strict Mode).
      loadGenerationRef.current += 1
    }
  }, [shouldRun, clientId, themeReady, deferReady, resolvedTheme])

  React.useEffect(() => {
    if (shouldRun) return
    promptedRef.current = false
    dismissActivePrompt()
  }, [shouldRun, dismissActivePrompt])

  // Keep document color-scheme in sync; do not cancel/re-prompt (FedCM abort noise).
  React.useEffect(() => {
    if (!shouldRun || !themeReady) return
    syncDocumentColorScheme(colorScheme)
  }, [colorScheme, shouldRun, themeReady])

  return null
}
