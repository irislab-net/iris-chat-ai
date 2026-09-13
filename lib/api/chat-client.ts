import {
  clearStoredTokens,
  getStoredAccessToken,
  notifyAuthSessionExpired,
  refreshAccessToken,
  storeTokenPair,
} from "@/lib/api/auth"
import { chatApiUrl } from "@/lib/api/chat"
import { isGuestChatSession } from "@/lib/chat-auth-session"
import {
  ensureGuestSession,
  getStoredGuestToken,
} from "@/lib/guest-chat"

/** Browser chat calls hit CHAT_API_ORIGIN directly (Bearer auth, no same-origin proxy). */
export async function chatApiFetch(path: string, init: RequestInit = {}) {
  const accessToken = getStoredAccessToken()
  if (!isGuestChatSession() && accessToken) {
    return authedChatFetch(path, init)
  }
  return guestChatFetch(path, init)
}

async function guestChatFetch(path: string, init: RequestInit = {}) {
  let token = getStoredGuestToken()
  if (!token) {
    const session = await ensureGuestSession()
    token = session.guest_token
  }

  const doFetch = (guestToken: string) =>
    fetch(chatApiUrl(path), {
      ...init,
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${guestToken}`,
      },
    })

  let res = await doFetch(token)
  if (res.status === 401) {
    const session = await ensureGuestSession()
    res = await doFetch(session.guest_token)
  }
  return res
}

async function authedChatFetch(path: string, init: RequestInit = {}) {
  const doFetch = (token: string | null) =>
    fetch(chatApiUrl(path), {
      ...init,
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

  let token = getStoredAccessToken()
  let res = await doFetch(token)

  if (res.status === 401) {
    try {
      const pair = await refreshAccessToken()
      storeTokenPair(pair)
      token = pair.access_token
      res = await doFetch(token)
    } catch {
      clearStoredTokens()
    }

    if (res.status === 401) {
      clearStoredTokens()
      notifyAuthSessionExpired()
    }
  }

  return res
}
