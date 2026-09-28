"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import {
  AUTH_SUCCESS_MESSAGE,
  establishSession,
  safeAuthReturnPath,
} from "@/lib/api/auth"
import {
  authSuccessDedupeId,
  claimAuthSuccessProcessed,
  clearAuthPwaPending,
  consumeAuthReturnTo,
  hasAuthPwaPending,
} from "@/lib/auth-pwa"
import { isStandaloneDisplay } from "@/lib/display-mode"
import { trackLoginFail, trackLoginSuccess } from "@/lib/analytics"
import { APP_NEWS_PATH } from "@/lib/site"
import { Skeleton } from "@/components/ui/skeleton"

export default function AuthSuccessPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [error, setError] = React.useState<string | null>(null)
  const [safariHandOff, setSafariHandOff] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const dedupeId = authSuccessDedupeId()
      const alreadyDone = claimAuthSuccessProcessed(dedupeId)
      const standalone = isStandaloneDisplay()
      const hasOpener = Boolean(window.opener && !window.opener.closed)

      // Popup flow (browser tabs only): refresh cookie is already set by the API.
      // Never use opener in standalone — iOS leaves the PWA for Safari.
      if (hasOpener && !standalone) {
        if (!alreadyDone) {
          window.opener.postMessage(
            { type: AUTH_SUCCESS_MESSAGE },
            window.location.origin
          )
        }
        window.close()
        return
      }

      if (alreadyDone) {
        clearAuthPwaPending()
        const returnTo = safeAuthReturnPath(
          consumeAuthReturnTo(APP_NEWS_PATH),
          APP_NEWS_PATH
        )
        router.replace(returnTo)
        return
      }

      try {
        // Full-page redirect (incl. PWA→Safari hand-off): establish from cookie.
        const pwaPending = hasAuthPwaPending()
        const session = await establishSession()
        if (cancelled) return
        clearAuthPwaPending()
        trackLoginSuccess(session.user)
        await refresh()
        if (cancelled) return

        // OAuth often finishes in Safari after leaving the Home Screen app.
        // Ask the user to reopen the icon when we are not already standalone.
        if (!standalone && pwaPending) {
          setSafariHandOff(true)
          return
        }

        const returnTo = safeAuthReturnPath(
          consumeAuthReturnTo(APP_NEWS_PATH),
          APP_NEWS_PATH
        )
        router.replace(returnTo)
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Session failed"
          setError(message)
          trackLoginFail(message)
          window.setTimeout(() => {
            if (hasOpener && !standalone && !window.opener?.closed) {
              window.opener.postMessage(
                { type: AUTH_SUCCESS_MESSAGE, error: true },
                window.location.origin
              )
              window.close()
              return
            }
            router.replace(
              safeAuthReturnPath(
                consumeAuthReturnTo(APP_NEWS_PATH),
                APP_NEWS_PATH
              )
            )
          }, 2000)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, refresh])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6">
      <Skeleton className="h-8 w-48" />
      <p className="text-sm text-muted-foreground">
        {error
          ? `Could not connect with Google: ${error}`
          : safariHandOff
            ? "Signed in. Open Exur from your Home Screen to continue."
            : "Connecting with Google…"}
      </p>
      {error ? (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Close this window and try Continue with Google again from the app.
        </p>
      ) : null}
      {safariHandOff ? (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Google sign-in finishes in Safari on iPhone. Your Home Screen app
          will pick up the session when you open it again.
        </p>
      ) : null}
    </div>
  )
}
