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
import { AuthErrorSheet } from "@/components/auth/auth-error-sheet"
import {
  AUTH_SESSION_EXPIRED_EVENT,
  bootstrapSession,
  clearStoredTokens,
  establishSessionAfterPlanUpgrade,
  getStoredAccessToken,
  hasPlanUpgradePendingRefresh,
  isPro,
  storeTokenPair,
} from "@/lib/api/auth"
import type { User } from "@/lib/api/types"
import { toAuthUserError, type AuthUserError } from "@/lib/auth-user-errors"
import { setChatRegisteredUserId } from "@/lib/chat-auth-session"
import {
  readChatStore,
  setActiveConversation,
  upsertConversation,
  writeChatStore,
  type ChatStore,
} from "@/lib/chat-storage"
import { getStoredGuestUserId, mergeGuestAccount } from "@/lib/guest-chat"
import {
  isValidWebSessionId,
  reboundWebSessionId,
} from "@/lib/web-session-id"

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

/** Copy guest threads that the backend can rewrite onto the registered user store. */
async function adoptGuestConversations(
  guestUserId: string,
  registeredUserId: string,
  guestStore: ChatStore
) {
  let next = readChatStore(registeredUserId)
  let changed = false
  for (const conversation of guestStore.conversations) {
    if (!(await isValidWebSessionId(guestUserId, conversation.id))) continue
    const id = await reboundWebSessionId(registeredUserId, conversation.id)
    if (!id) continue
    next = upsertConversation(next, { ...conversation, id })
    changed = true
  }
  if (
    guestStore.activeId &&
    (await isValidWebSessionId(guestUserId, guestStore.activeId))
  ) {
    const activeId = await reboundWebSessionId(
      registeredUserId,
      guestStore.activeId
    )
    if (activeId) {
      next = setActiveConversation(next, activeId)
      changed = true
    }
  }
  if (changed) writeChatStore(registeredUserId, next)
}

async function mergeGuestAfterLogin(registeredUserId: string) {
  const token = getStoredAccessToken()
  if (!token) return
  const guestUserId = getStoredGuestUserId()
  const guestStore = readChatStore(null)
  const guestSessions = guestStore.conversations.map(
    (conversation) => conversation.id
  )
  try {
    const merged = await mergeGuestAccount(
      token,
      guestSessions.length > 0 ? guestSessions : undefined
    )
    if (merged && guestUserId) {
      await adoptGuestConversations(guestUserId, registeredUserId, guestStore)
    }
  } catch {
    // Best-effort; guest storage remains for retry.
  }
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loginPending, setLoginPending] = React.useState(false)
  const [userError, setUserError] = React.useState<AuthUserError | null>(null)

  const showError = React.useCallback((raw: unknown) => {
    console.error("[exur-auth]", raw)
    setUserError(toAuthUserError(raw))
  }, [])

  const clearError = React.useCallback(() => setUserError(null), [])

  const applySession = React.useCallback((session: { user: User | null }) => {
    setUser(session.user)
    // Drives chatApiFetch guest vs authed Bearer — must stay in sync with UI auth.
    setChatRegisteredUserId(session.user?.id ?? null)
  }, [])

  const refreshSession = React.useCallback(async () => {
    await hydrateAccessFromChrome()
    try {
      const session = await bootstrapSession()
      applySession(session)
      if (!session.user) clearStoredTokens()
      return session
    } catch (err) {
      clearStoredTokens()
      applySession({ user: null })
      throw err
    }
  }, [applySession])

  const refresh = React.useCallback(async () => {
    await refreshSession()
  }, [refreshSession])

  const refreshAfterUpgrade = React.useCallback(async () => {
    try {
      const session = await establishSessionAfterPlanUpgrade()
      applySession(session)
    } catch {
      await refresh()
    }
  }, [refresh, applySession])

  React.useEffect(() => {
    void (async () => {
      try {
        if (hasPlanUpgradePendingRefresh()) {
          try {
            const session = await establishSessionAfterPlanUpgrade()
            applySession(session)
            return
          } catch {
            // Keep pending flag so chat can retry minting a Plus JWT.
          }
        }
        if (await isLoggedIn()) await refresh()
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh, applySession])

  React.useEffect(() => {
    function onSessionExpired() {
      clearStoredTokens()
      applySession({ user: null })
      setLoginPending(false)
    }
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
    return () =>
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [applySession])

  React.useEffect(() => {
    function onMessage(message: unknown) {
      if (!isExurLoginMessage(message)) return
      if (message.type === EXUR_AUTH_SUCCESS) {
        void refreshSession()
          .then((session) => {
            if (session.user?.id) return mergeGuestAfterLogin(session.user.id)
          })
          .then(() => clearError())
          .catch((err) => {
            showError(err)
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
        showError(message.error)
      }
    }

    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [clearError, refreshSession, showError])

  const login = React.useCallback(
    (_options?: LoginOptions) => {
      setLoginPending(true)
      clearError()
      void chrome.runtime.sendMessage({ type: EXUR_OPEN_LOGIN }).catch((err) => {
        console.error("extension open login", err)
        showError(err)
        setLoginPending(false)
      })
    },
    [clearError, showError]
  )

  const logout = React.useCallback(async () => {
    await extensionLogout()
    clearStoredTokens()
    applySession({ user: null })
  }, [applySession])

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
      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        {children}
      </div>
      <AuthErrorSheet
        error={userError}
        open={Boolean(userError)}
        onOpenChange={(open) => {
          if (!open) clearError()
        }}
        onClose={clearError}
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
export type { LoginOptions }
