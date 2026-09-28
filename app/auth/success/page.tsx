"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AUTH_SUCCESS_MESSAGE,
  establishSession,
  safeAuthReturnPath,
} from "@/lib/api/auth"
import {
  authSuccessDedupeId,
  clearAuthPwaPending,
  consumeAuthReturnTo,
  hasAuthPwaPending,
  markAuthSuccessProcessed,
  wasAuthSuccessProcessed,
} from "@/lib/auth-pwa"
import { isStandaloneDisplay } from "@/lib/display-mode"
import { trackLoginFail, trackLoginSuccess } from "@/lib/analytics"
import { landingCta } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const ESTABLISH_TIMEOUT_MS = 20_000
const POPUP_CLOSE_FALLBACK_MS = 400

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(label))
    }, ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      }
    )
  })
}

function goHome(
  router: ReturnType<typeof useRouter>,
  fallback = APP_NEWS_PATH
) {
  const returnTo = safeAuthReturnPath(consumeAuthReturnTo(fallback), fallback)
  router.replace(returnTo)
}

export default function AuthSuccessPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [error, setError] = React.useState<string | null>(null)
  const [safariHandOff, setSafariHandOff] = React.useState(false)
  const [retryToken, setRetryToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    ;(async () => {
      const dedupeId = authSuccessDedupeId()
      const alreadyDone = wasAuthSuccessProcessed(dedupeId)
      const standalone = isStandaloneDisplay()
      const hasOpener = Boolean(window.opener && !window.opener.closed)

      // Popup flow (browser tabs only): notify opener, then try to close.
      // If close is ignored (common), fall through and finish in this window.
      if (hasOpener && !standalone) {
        try {
          window.opener.postMessage(
            { type: AUTH_SUCCESS_MESSAGE },
            window.location.origin
          )
        } catch {
          // Cross-origin / gone opener
        }
        window.close()
        await new Promise((resolve) => {
          window.setTimeout(resolve, POPUP_CLOSE_FALLBACK_MS)
        })
        if (cancelled || window.closed) return
      }

      // Reloaded callback after a successful exchange — go home (session may
      // already be in storage). Still try a quick establish when possible.
      if (alreadyDone) {
        try {
          await withTimeout(
            establishSession(),
            8_000,
            "Session restore timed out"
          )
          if (cancelled) return
          await refresh()
        } catch {
          // Navigate anyway — tokens may already be local.
        }
        if (cancelled) return
        clearAuthPwaPending()
        goHome(router)
        return
      }

      try {
        const pwaPending = hasAuthPwaPending()
        const session = await withTimeout(
          establishSession(),
          ESTABLISH_TIMEOUT_MS,
          "Sign-in timed out. Please try again."
        )
        if (cancelled) return

        markAuthSuccessProcessed(dedupeId)
        trackLoginSuccess(session.user)
        await refresh()
        if (cancelled) return

        // OAuth often finishes in Safari after leaving the Home Screen app.
        // Keep PWA pending so the installed app can resume the shared cookie.
        if (!standalone && pwaPending) {
          setSafariHandOff(true)
          return
        }

        clearAuthPwaPending()
        goHome(router)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Session failed"
        setError(message)
        trackLoginFail(message)
        window.setTimeout(() => {
          if (cancelled) return
          if (hasOpener && !standalone && !window.opener?.closed) {
            try {
              window.opener.postMessage(
                { type: AUTH_SUCCESS_MESSAGE, error: true },
                window.location.origin
              )
            } catch {
              // ignore
            }
            window.close()
            window.setTimeout(() => {
              if (!window.closed) goHome(router)
            }, POPUP_CLOSE_FALLBACK_MS)
            return
          }
          goHome(router)
        }, 2_500)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, refresh, retryToken])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6">
      {!error && !safariHandOff ? <Skeleton className="h-8 w-48" /> : null}
      <p className="text-sm text-muted-foreground">
        {error
          ? `Could not connect with Google: ${error}`
          : safariHandOff
            ? "Signed in. Open Exur from your Home Screen to continue."
            : "Connecting with Google…"}
      </p>
      {error ? (
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Close this window and try Continue with Google again from the app,
            or retry here.
          </p>
          <Button
            type="button"
            className={cn(landingCta("primary", "sm"), "min-w-40")}
            onClick={() => {
              setError(null)
              setRetryToken((n) => n + 1)
            }}
          >
            Try again
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={() => goHome(router)}
          >
            Back to Exur
          </Button>
        </div>
      ) : null}
      {safariHandOff ? (
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Google sign-in finishes in Safari on iPhone. Your Home Screen app
            will pick up the session when you open it again.
          </p>
          <Button
            type="button"
            className={cn(landingCta("primary", "sm"), "min-w-40")}
            onClick={() => {
              clearAuthPwaPending()
              goHome(router)
            }}
          >
            Continue in Safari
          </Button>
        </div>
      ) : null}
    </div>
  )
}
