"use client"

import { usePathname } from "next/navigation"
import * as React from "react"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { getGoogleClientId, isGoogleOneTapConfigured } from "@/lib/api/config"
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
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
  }
  if (resolvedTheme === "dark") return "dark"
  return "light"
}

function handlePromptMoment(notification: GooglePromptMomentNotification) {
  if (notification.isSkippedMoment()) {
    const reason = notification.getSkippedReason()
    if (reason === "user_cancel" || reason === "tap_outside") {
      markGoogleOneTapDismissed()
    }
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
    use_fedcm_for_prompt: false,
  })

  window.google.accounts.id.prompt(handlePromptMoment)
}

export function GoogleOneTap({ enabled, onCredential }: GoogleOneTapProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const clientId = getGoogleClientId()
  const onCredentialRef = React.useRef(onCredential)
  const promptedRef = React.useRef(false)
  const themePromptTimerRef = React.useRef<number | null>(null)
  const lastColorSchemeRef = React.useRef<BrowserChromeTheme | null>(null)

  React.useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  const shouldRun =
    enabled &&
    isGoogleOneTapConfigured() &&
    !isAuthRoute(pathname) &&
    !isGoogleOneTapDismissed()

  const colorScheme = resolveGoogleOneTapColorScheme(resolvedTheme)
  const themeReady = resolvedTheme === "light" || resolvedTheme === "dark"
  // Keep ~100KB GIS off the chat critical path (Lighthouse unused-JS / TBT).
  const deferReady = useIdleReady(Boolean(shouldRun && clientId && themeReady), 15_000)

  React.useEffect(() => {
    if (!shouldRun || !clientId || !themeReady || !deferReady || promptedRef.current)
      return

    let cancelled = false
    const scheme = resolveGoogleOneTapColorScheme(resolvedTheme)

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || promptedRef.current) return
        promptedRef.current = true
        lastColorSchemeRef.current = scheme
        runGoogleOneTapPrompt(clientId, scheme, (credential) => {
          onCredentialRef.current(credential)
        })
      })
      .catch(() => {
        // GIS blocked or failed to load — fall back to manual Google sign-in.
      })

    return () => {
      cancelled = true
    }
  }, [shouldRun, clientId, themeReady, deferReady, resolvedTheme])

  React.useEffect(() => {
    if (!shouldRun || !clientId || !themeReady || !promptedRef.current) return
    if (lastColorSchemeRef.current === colorScheme) return

    if (themePromptTimerRef.current !== null) {
      window.clearTimeout(themePromptTimerRef.current)
    }

    themePromptTimerRef.current = window.setTimeout(() => {
      themePromptTimerRef.current = null
      if (!shouldRun || isGoogleOneTapDismissed()) return

      lastColorSchemeRef.current = colorScheme
      cancelGoogleOneTap()

      void loadGoogleIdentityScript().then(() => {
        runGoogleOneTapPrompt(clientId, colorScheme, (credential) => {
          onCredentialRef.current(credential)
        })
      })
    }, 400)

    return () => {
      if (themePromptTimerRef.current !== null) {
        window.clearTimeout(themePromptTimerRef.current)
        themePromptTimerRef.current = null
      }
    }
  }, [colorScheme, shouldRun, clientId, themeReady])

  React.useEffect(() => {
    if (!enabled) {
      cancelGoogleOneTap()
    }
  }, [enabled])

  React.useEffect(() => {
    if (!shouldRun) {
      promptedRef.current = false
      lastColorSchemeRef.current = null
    }
  }, [shouldRun])

  return null
}
