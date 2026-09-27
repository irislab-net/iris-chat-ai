import * as React from "react"

import { isLoggedIn, logout as extensionLogout } from "@/adapters/auth"
import {
  EXUR_AUTH_CANCELLED,
  EXUR_AUTH_SUCCESS,
  EXUR_LOGIN_ERROR,
  EXUR_OPEN_LOGIN,
  isExurLoginMessage,
} from "@/adapters/login-messages"
import { chromeTokenStore } from "@/adapters/token-store"
import {
  AUTH_SESSION_EXPIRED_EVENT,
  bootstrapSession,
  clearStoredTokens,
  consumePlanUpgradePendingRefresh,
  establishSession,
  getStoredAccessToken,
  hasPlanUpgradePendingRefresh,
  isPro,
  storeTokenPair,
} from "@/lib/api/auth"
import type { User } from "@/lib/api/types"
import { readChatStore } from "@/lib/chat-storage"
import { mergeGuestAccount } from "@/lib/guest-chat"

type LoginOptions = { source?: string }

type AuthContextValue = {
  user: User | null
  loading: boolean
  loginPending: boolean
  isAuthenticated: boolean
  isProUser: boolean
  login: (options?: LoginOptions) => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
  refreshAfterUpgrade: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

async function hydrateAccessFromChrome(): Promise<boolean> {
  const token = await chromeTokenStore.getAccessToken()
  if (!token) return false
  const expires =
    (await chrome.storage.local.get(["exur_ext_expires_at"])).exur_ext_expires_at ??
    new Date(Date.now() + 3600_000).toISOString()
  storeTokenPair({ access_token: token, expires_at: String(expires) })
  return true
}

async function mergeGuestAfterLogin() {
  const token = getStoredAccessToken()
  if (!token) return
  const guestSessions = readChatStore(null).conversations.map(
    (conversation) => conversation.id
  )
  try {
    await mergeGuestAccount(
      token,
      guestSessions.length > 0 ? guestSessions : undefined
    )
  } catch {
    // Best-effort; guest storage remains for retry.
  }
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loginPending, setLoginPending] = React.useState(false)
  const [loginError, setLoginError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    await hydrateAccessFromChrome()
    try {
      const session = await bootstrapSession()
      setUser(session.user)
      if (!session.user) clearStoredTokens()
    } catch {
      clearStoredTokens()
      setUser(null)
    }
  }, [])

  const refreshAfterUpgrade = React.useCallback(async () => {
    try {
      const session = await establishSession()
      setUser(session.user)
    } catch {
      await refresh()
    }
  }, [refresh])

  React.useEffect(() => {
    void (async () => {
      try {
        if (hasPlanUpgradePendingRefresh()) {
          try {
            const session = await establishSession()
            consumePlanUpgradePendingRefresh()
            setUser(session.user)
            return
          } catch {
            consumePlanUpgradePendingRefresh()
          }
        }
        if (await isLoggedIn()) await refresh()
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh])

  React.useEffect(() => {
    function onSessionExpired() {
      clearStoredTokens()
      setUser(null)
      setLoginPending(false)
    }
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
    return () =>
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [])

  React.useEffect(() => {
    function onMessage(message: unknown) {
      if (!isExurLoginMessage(message)) return
      if (message.type === EXUR_AUTH_SUCCESS) {
        void refresh()
          .then(() => mergeGuestAfterLogin())
          .catch((err) => {
            console.error("extension login refresh", err)
          })
          .finally(() => setLoginPending(false))
        return
      }
      if (message.type === EXUR_AUTH_CANCELLED) {
        setLoginPending(false)
        return
      }
      if (message.type === EXUR_LOGIN_ERROR) {
        setLoginPending(false)
        setLoginError(message.error)
      }
    }

    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [refresh])

  const login = React.useCallback((_options?: LoginOptions) => {
    setLoginPending(true)
    setLoginError(null)
    void chrome.runtime
      .sendMessage({ type: EXUR_OPEN_LOGIN })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Could not open sign-in"
        console.error("extension open login", err)
        setLoginError(message)
        setLoginPending(false)
        window.alert(message)
      })
  }, [])

  const logout = React.useCallback(async () => {
    await extensionLogout()
    clearStoredTokens()
    setUser(null)
  }, [])

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
      {loginError ? (
        <p className="sr-only" role="alert">
          {loginError}
        </p>
      ) : null}
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export { AuthProvider, useAuth }
export type { LoginOptions }
