"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { AUTH_SUCCESS_MESSAGE, establishSession } from "@/lib/api/auth"
import { trackLoginFail, trackLoginSuccess } from "@/lib/analytics"
import { APP_NEWS_PATH } from "@/lib/site"
import { Skeleton } from "@/components/ui/skeleton"

export default function AuthSuccessPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Popup flow: refresh cookie is already set by the API callback.
        // Opener refreshes once — do not touch tokens here.
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: AUTH_SUCCESS_MESSAGE },
            window.location.origin
          )
          window.close()
          return
        }

        // Full-page redirect: establish from HttpOnly refresh cookie only.
        const session = await establishSession()
        if (cancelled) return
        trackLoginSuccess(session.user)
        await refresh()
        if (!cancelled) router.replace(APP_NEWS_PATH)
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Session failed"
          setError(message)
          trackLoginFail(message)
          setTimeout(() => {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                { type: AUTH_SUCCESS_MESSAGE, error: true },
                window.location.origin
              )
              window.close()
            } else {
              router.replace(APP_NEWS_PATH)
            }
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
          : "Connecting with Google…"}
      </p>
      {error ? (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Close this window and try Continue with Google again from the app.
        </p>
      ) : null}
    </div>
  )
}
