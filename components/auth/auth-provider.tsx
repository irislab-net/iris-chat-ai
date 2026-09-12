"use client"

import * as React from "react"

import { LoginConsentDialog } from "@/components/auth/login-consent-dialog"
import {
  AUTH_POPUP_CLOSED_EVENT,
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_SUCCESS_MESSAGE,
  bootstrapSession,
  getStoredAccessToken,
  isPro,
  logoutRemote,
  startLoginWithGoogle,
} from "@/lib/api/auth"
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
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

const POPUP_REFRESH_ATTEMPTS = 4
const POPUP_REFRESH_DELAY_MS = 450

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms))
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

  const refresh = React.useCallback(async () => {
    const session = await bootstrapSession()
    setUser(session.user)
    setChatRegisteredUserId(session.user?.id ?? null)
    if (session.user) {
      setLoginPending(false)
      setAnalyticsUser(session.user)
    } else {
      setAnalyticsUser(null)
    }
  }, [])

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
    ;(async () => {
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

  const login = React.useCallback((options?: LoginOptions) => {
    if (loginPending) return
    pendingLoginRef.current = options
    setConsentOpen(true)
  }, [loginPending])

  const confirmLegalAndLogin = React.useCallback(() => {
    const options = pendingLoginRef.current
    pendingLoginRef.current = undefined
    setConsentOpen(false)

    loginSourceRef.current = options?.source
    trackLoginStart(options?.source, options?.ref)
    setLoginPending(true)
    startLoginWithGoogle({
      ref: options?.ref,
      legalAccepted: true,
      returnTo: APP_PATH,
    })
  }, [])

  const onConsentOpenChange = React.useCallback(
    (open: boolean) => {
      if (loginPending) return
      setConsentOpen(open)
      if (!open) pendingLoginRef.current = undefined
    },
    [loginPending]
  )

  const logout = React.useCallback(async () => {
    const userId = user?.id
    trackLogout()
    loginAttemptInFlight.current = null
    loginSourceRef.current = undefined
    pendingLoginRef.current = undefined
    setConsentOpen(false)
    await logoutRemote()
    resetClientSessionOnLogout({ userId })
    setUser(null)
    setChatRegisteredUserId(null)
    setLoginPending(false)
  }, [user?.id])

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
    }),
    [user, loading, loginPending, login, logout, refresh]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginConsentDialog
        open={consentOpen}
        onOpenChange={onConsentOpenChange}
        onConfirm={confirmLegalAndLogin}
        confirming={loginPending}
      />
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
