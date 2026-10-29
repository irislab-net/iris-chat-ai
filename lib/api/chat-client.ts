import {
  clearStoredTokens,
  getStoredAccessToken,
  notifyAuthSessionExpired,
  refreshAccessToken,
  storeTokenPair,
} from "@/lib/api/auth"
import { chatApiPath } from "@/lib/api/chat"
import { isGuestChatSession } from "@/lib/chat-auth-session"
import { ensureGuestSession, getStoredGuestToken } from "@/lib/guest-chat"

/** Browser chat calls use same-origin /v1/chat proxy (see app/v1/[...path]/route.ts). */
export async function chatApiFetch(path: string, init: RequestInit = {}) {
  const accessToken = getStoredAccessToken()
  const guestSession = isGuestChatSession()
  const useAuthed = !guestSession && Boolean(accessToken)
  // #region agent log
  fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7c7463",
    },
    body: JSON.stringify({
      sessionId: "7c7463",
      hypothesisId: "D",
      location: "lib/api/chat-client.ts:chatApiFetch",
      message: "chatApiFetch route choice",
      data: {
        path,
        method: init.method ?? "GET",
        guestSession,
        hasAccessToken: Boolean(accessToken),
        useAuthed,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  if (useAuthed) {
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
    fetch(chatApiPath(path), {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${guestToken}`,
      },
    })

  let res = await doFetch(token)
  if (res.status === 401) {
    // #region agent log
    fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "7c7463",
      },
      body: JSON.stringify({
        sessionId: "7c7463",
        hypothesisId: "A",
        location: "lib/api/chat-client.ts:guestChatFetch",
        message: "guest 401; reminting guest session",
        data: { path, firstStatus: 401 },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    const session = await ensureGuestSession()
    res = await doFetch(session.guest_token)
  } else if (res.status === 404 || res.status >= 500) {
    // #region agent log
    fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "7c7463",
      },
      body: JSON.stringify({
        sessionId: "7c7463",
        hypothesisId: "B",
        location: "lib/api/chat-client.ts:guestChatFetch",
        message: "guest upstream non-auth failure",
        data: { path, status: res.status },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  }
  return res
}

async function authedChatFetch(path: string, init: RequestInit = {}) {
  const doFetch = (token: string | null) =>
    fetch(chatApiPath(path), {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

  let token = getStoredAccessToken()
  let res = await doFetch(token)
  const firstStatus = res.status

  if (res.status === 401) {
    let refreshOk = false
    try {
      const pair = await refreshAccessToken()
      storeTokenPair(pair)
      token = pair.access_token
      res = await doFetch(token)
      refreshOk = true
    } catch {
      clearStoredTokens()
    }

    if (res.status === 401) {
      clearStoredTokens()
      notifyAuthSessionExpired()
      // #region agent log
      fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "7c7463",
        },
        body: JSON.stringify({
          sessionId: "7c7463",
          hypothesisId: "A",
          location: "lib/api/chat-client.ts:authedChatFetch",
          message: "session expired notified after 401",
          data: { path, firstStatus, refreshOk, finalStatus: res.status },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    } else {
      // #region agent log
      fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "7c7463",
        },
        body: JSON.stringify({
          sessionId: "7c7463",
          hypothesisId: "A",
          location: "lib/api/chat-client.ts:authedChatFetch",
          message: "401 recovered via refresh",
          data: { path, firstStatus, refreshOk, finalStatus: res.status },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    }
  } else if (res.status === 404 || res.status >= 500) {
    // #region agent log
    fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "7c7463",
      },
      body: JSON.stringify({
        sessionId: "7c7463",
        hypothesisId: "B",
        location: "lib/api/chat-client.ts:authedChatFetch",
        message: "upstream non-auth failure",
        data: { path, status: res.status },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  }

  return res
}
