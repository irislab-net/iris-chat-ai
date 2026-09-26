"use client"

import * as React from "react"

import { GoogleOneTap } from "@/components/auth/google-one-tap"
import dynamic from "next/dynamic"
import {
  AUTH_POPUP_CLOSED_EVENT,
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_SUCCESS_MESSAGE,
  bootstrapSession,
  establishSession,
  exchangeGoogleOneTapCredential,
  getStoredAccessToken,
  isPro,
  logoutRemote,
  startLoginWithGoogle,
} from "@/lib/api/auth"

const LoginConsentDialog = dynamic(
  () =>
    import("@/components/auth/login-consent-dialog").then(
      (m) => m.LoginConsentDialog
    ),
  { ssr: false }
)
import { clearGoogleOneTapDismissed } from "@/lib/google-one-tap"
import { setChatRegisteredUserId } from "@/lib/chat-auth-session"
import { readChatStore } from "@/lib/chat-storage"
import { mergeGuestAccount } from "@/lib/guest-chat"
import type { User } from "@/lib/api/types"
import {
  setAnalyticsUser,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
  trackLogout,
  type LoginSource,
} from "@/lib/analytics"
import { isMarketingHost } from "@/lib/hosts"
import { APP_PATH } from "@/lib/site"
import { resetClientSessionOnLogout } from "@/lib/session-reset"

type LoginOptions = {
  ref?: string
  source?: LoginSource
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  /** True while the Google OAuth popup flow is in progress. */
  loginPending: boolean
  isAuthenticated: boolean
  isProUser: boolean
  login: (options?: LoginOptions) => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
  /** Mint a fresh access token and reload profile (e.g. after plan upgrade). */
  refreshAfterUpgrade: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

const POPUP_REFRESH_ATTEMPTS = 4
const POPUP_REFRESH_DELAY_MS = 450

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isMarketingDocument(): boolean {
  if (typeof window === "undefined") return false
  return isMarketingHost(window.location.hostname)
}

function whenIdle(task: () => void) {
  // Prefer interaction; fall back to a long timer — never requestIdleCallback
  // (Lighthouse quiet windows arm it early and inflate auth/analytics TBT).
  const events = ["pointerdown", "keydown", "touchstart"] as const
  let settled = false
  const run = () => {
    if (settled) return
    settled = true
    for (const event of events) {
      window.removeEventListener(event, run)
    }
    task()
  }
  for (const event of events) {
    window.addEventListener(event, run, { once: true, passive: true })
  }
  const timeout = window.setTimeout(run, 15_000)
  return () => {
    settled = true
    for (const event of events) {
      window.removeEventListener(event, run)
    }
    window.clearTimeout(timeout)
  }
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const isOAuthPopupCallback =
    typeof window !== "undefined" &&
    Boolean(window.opener && !window.opener.closed) &&
    window.location.pathname.startsWith("/auth/success")

  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(!isOAuthPopupCallback)
  const [loginPending, setLoginPending] = React.useState(false)
  const [consentOpen, setConsentOpen] = React.useState(false)
  const loginAttemptInFlight = React.useRef<Promise<void> | null>(null)
  const loginSourceRef = React.useRef<LoginSource | undefined>(undefined)
  const pendingLoginRef = React.useRef<LoginOptions | undefined>(undefined)
  const pendingCredentialRef = React.useRef<string | null>(null)

  const applySession = React.useCallback((session: { user: User | null }) => {
    setUser(session.user)
    setChatRegisteredUserId(session.user?.id ?? null)
    if (session.user) {
      setLoginPending(false)
      setAnalyticsUser(session.user)
    } else {
      setAnalyticsUser(null)
    }
  }, [])

  const refresh = React.useCallback(async () => {
    applySession(await bootstrapSession())
  }, [applySession])

  const refreshAfterUpgrade = React.useCallback(async () => {
    applySession(await establishSession())
  }, [applySession])

  /** After popup closes / success ping — retry cookie race, then clear connecting. */
  const completeLoginAttempt = React.useCallback(async () => {
    if (loginAttemptInFlight.current) {
      await loginAttemptInFlight.current
      return
    }

    const source = loginSourceRef.current

    loginAttemptInFlight.current = (async () => {
      for (let attempt = 0; attempt < POPUP_REFRESH_ATTEMPTS; attempt++) {
        try {
          const session = await bootstrapSession()
          if (session.user) {
            setUser(session.user)
            setChatRegisteredUserId(session.user.id)
            setLoginPending(false)
            trackLoginSuccess(session.user, source)
            loginSourceRef.current = undefined
            const token = getStoredAccessToken()
            if (token) {
              const guestSessions = readChatStore(null).conversations.map(
                (conversation) => conversation.id
              )
              try {
                await mergeGuestAccount(
                  token,
                  guestSessions.length > 0 ? guestSessions : undefined
                )
              } catch {
                // Merge is best-effort; guest storage remains for retry.
              }
            }
            return
          }
        } catch {
          // keep trying through cookie race
        }
        if (attempt < POPUP_REFRESH_ATTEMPTS - 1) {
          await wait(POPUP_REFRESH_DELAY_MS)
        }
      }
      trackLoginFail("session_not_established", source)
      loginSourceRef.current = undefined
      setLoginPending(false)
    })()

    try {
      await loginAttemptInFlight.current
    } finally {
      loginAttemptInFlight.current = null
    }
  }, [])

  React.useEffect(() => {
    setChatRegisteredUserId(user?.id ?? null)
  }, [user?.id])

  React.useEffect(() => {
    // OAuth popup: cookie is set by the API; opener will refresh once.
    // Bootstrapping here races the opener and triggers refresh-token reuse detection.
    if (isOAuthPopupCallback) return

    let cancelled = false

    const runBootstrap = () => {
      void (async () => {
        try {
          const session = await bootstrapSession()
          if (!cancelled) {
            setUser(session.user)
            setChatRegisteredUserId(session.user?.id ?? null)
            if (session.user) setAnalyticsUser(session.user)
          }
        } catch {
          if (!cancelled) {
            setUser(null)
            setChatRegisteredUserId(null)
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }

    // Marketing: defer session + One Tap until idle so LCP/TBT stay clean.
    if (isMarketingDocument()) {
      const cancelIdle = whenIdle(() => {
        if (!cancelled) runBootstrap()
      })
      // Async so we do not sync-setState in the effect body (eslint).
      const loadingTimer = window.setTimeout(() => {
        if (!cancelled) setLoading(false)
      }, 0)
      return () => {
        cancelled = true
        cancelIdle()
        window.clearTimeout(loadingTimer)
      }
    }

    runBootstrap()
    return () => {
      cancelled = true
    }
  }, [isOAuthPopupCallback])

  React.useEffect(() => {
    function onSessionExpired() {
      setUser(null)
      setChatRegisteredUserId(null)
      setLoginPending(false)
      setAnalyticsUser(null)
    }
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
    return () =>
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [])

  React.useEffect(() => {
    const successHandled = { current: false }
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== AUTH_SUCCESS_MESSAGE) return
      successHandled.current = true
      if (event.data?.error) {
        trackLoginFail("oauth_callback_error", loginSourceRef.current)
        loginSourceRef.current = undefined
        setLoginPending(false)
        return
      }
      void completeLoginAttempt()
    }
    function onPopupClosed() {
      // Prefer postMessage from /auth/success; popup-closed is a fallback only.
      if (successHandled.current) return
      // Give postMessage a brief head start when both fire together.
      window.setTimeout(() => {
        if (successHandled.current) return
        void completeLoginAttempt()
      }, 300)
    }
    window.addEventListener("message", onMessage)
    window.addEventListener(AUTH_POPUP_CLOSED_EVENT, onPopupClosed)
    return () => {
      window.removeEventListener("message", onMessage)
      window.removeEventListener(AUTH_POPUP_CLOSED_EVENT, onPopupClosed)
    }
  }, [completeLoginAttempt])

  const login = React.useCallback(
    (options?: LoginOptions) => {
      if (loginPending) return
      pendingCredentialRef.current = null
      pendingLoginRef.current = options
      setConsentOpen(true)
    },
    [loginPending]
  )

  const handleOneTapCredential = React.useCallback(
    (credential: string) => {
      if (loginPending || user) return
      pendingCredentialRef.current = credential
      pendingLoginRef.current = { source: "one_tap" }
      setConsentOpen(true)
    },
    [loginPending, user]
  )

  const confirmLegalAndLogin = React.useCallback(() => {
    const options = pendingLoginRef.current
    const credential = pendingCredentialRef.current
    pendingLoginRef.current = undefined
    pendingCredentialRef.current = null
    setConsentOpen(false)

    loginSourceRef.current = options?.source
    trackLoginStart(options?.source, options?.ref)
    setLoginPending(true)

    if (credential) {
      void (async () => {
        try {
          await exchangeGoogleOneTapCredential({
            credential,
            legalAccepted: true,
          })
          clearGoogleOneTapDismissed()
          await completeLoginAttempt()
        } catch (error) {
          trackLoginFail(
            error instanceof Error ? error.message : "one_tap_exchange_failed",
            options?.source
          )
          startLoginWithGoogle({
            ref: options?.ref,
            legalAccepted: true,
            returnTo: APP_PATH,
          })
        }
      })()
      return
    }

    startLoginWithGoogle({
      ref: options?.ref,
      legalAccepted: true,
      returnTo: APP_PATH,
    })
  }, [completeLoginAttempt])

  const onConsentOpenChange = React.useCallback(
    (open: boolean) => {
      if (loginPending) return
      setConsentOpen(open)
      if (!open) {
        pendingLoginRef.current = undefined
        pendingCredentialRef.current = null
      }
    },
    [loginPending]
  )

  const logout = React.useCallback(async () => {
    const userId = user?.id
    trackLogout()
    loginAttemptInFlight.current = null
    loginSourceRef.current = undefined
    pendingLoginRef.current = undefined
    pendingCredentialRef.current = null
    setConsentOpen(false)
    await logoutRemote()
    resetClientSessionOnLogout({ userId })
    setUser(null)
    setChatRegisteredUserId(null)
    setLoginPending(false)
  }, [user?.id])

  const oneTapEnabled =
    !loading &&
    !user &&
    !loginPending &&
    !consentOpen &&
    !isOAuthPopupCallback &&
    // One Tap competes with LCP on the marketing apex — keep it on chat only.
    !isMarketingDocument()

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      loginPending,
      isAuthenticated: Boolean(user),
      isProUser: isPro(user),
      login,
      logout,
      refresh,
      refreshAfterUpgrade,
    }),
    [user, loading, loginPending, login, logout, refresh, refreshAfterUpgrade]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <GoogleOneTap
        enabled={oneTapEnabled}
        onCredential={handleOneTapCredential}
      />
      {consentOpen ? (
        <LoginConsentDialog
          open={consentOpen}
          onOpenChange={onConsentOpenChange}
          onConfirm={confirmLegalAndLogin}
          confirming={loginPending}
        />
      ) : null}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export { AuthProvider, useAuth }
export type { LoginOptions, LoginSource }
