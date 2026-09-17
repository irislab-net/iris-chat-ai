"use client"

import { usePathname } from "next/navigation"
import * as React from "react"

import { getGoogleClientId, isGoogleOneTapConfigured } from "@/lib/api/config"
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

export function GoogleOneTap({ enabled, onCredential }: GoogleOneTapProps) {
  const pathname = usePathname()
  const clientId = getGoogleClientId()
  const promptedRef = React.useRef(false)
  const onCredentialRef = React.useRef(onCredential)

  React.useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  const shouldRun =
    enabled &&
    isGoogleOneTapConfigured() &&
    !isAuthRoute(pathname) &&
    !isGoogleOneTapDismissed()

  React.useEffect(() => {
    if (!shouldRun || !clientId) return

    let cancelled = false

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return
        if (promptedRef.current) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response.credential?.trim()
            if (!credential) return
            onCredentialRef.current(credential)
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          itp_support: true,
          use_fedcm_for_prompt: true,
        })

        promptedRef.current = true
        window.google.accounts.id.prompt((notification) => {
          if (notification.isDismissedMoment()) {
            const reason = notification.getDismissedReason()
            if (reason !== "credential_returned") {
              markGoogleOneTapDismissed()
            }
          }
          if (notification.isSkippedMoment()) {
            markGoogleOneTapDismissed()
          }
        })
      })
      .catch(() => {
        // GIS blocked or failed to load — fall back to manual Google sign-in.
      })

    return () => {
      cancelled = true
      cancelGoogleOneTap()
    }
  }, [shouldRun, clientId, pathname])

  React.useEffect(() => {
    if (!enabled) {
      cancelGoogleOneTap()
    }
  }, [enabled])

  return null
}
