import {
  clearStoredTokens,
  getStoredAccessToken,
  notifyAuthSessionExpired,
  refreshAccessToken,
  storeTokenPair,
} from "@/lib/api/auth"

export async function apiFetch(path: string, init: RequestInit = {}) {
  // Same-origin /v1 rewrite — avoids CORS issues with credentialed/authenticated calls
  const doFetch = (token: string | null) =>
    fetch(path, {
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

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(
      new Error(body.error || `request failed ${res.status}`),
      {
        status: res.status,
        body,
      }
    )
  }
  return body as T
}
