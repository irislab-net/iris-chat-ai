import { chatApiPath, type ApiClientConfig } from "./config"
import type { GuestSessionResponse } from "./types"

function unwrapChatPayload<T extends object>(body: unknown): T {
  if (!body || typeof body !== "object") return {} as T
  const record = body as Record<string, unknown>
  if (record.data && typeof record.data === "object") {
    return record.data as T
  }
  return body as T
}

export function createChatFetch(config: ApiClientConfig) {
  const credentials = config.credentials ?? "omit"

  async function ensureGuestToken(): Promise<string> {
    const existing = (await config.tokenStore.getGuestToken?.()) ?? null
    const url = chatApiPath(config.baseUrl, "/guest/session")
    const res = await fetch(url, {
      method: "POST",
      credentials,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existing ? { guest_token: existing } : {}),
    })
    const raw = await res.json().catch(() => ({}))
    const payload = unwrapChatPayload<
      GuestSessionResponse & { error?: string; code?: string }
    >(raw)
    if (!res.ok || !payload.guest_token) {
      throw Object.assign(
        new Error(payload.error || `guest session failed ${res.status}`),
        { status: res.status, code: payload.code, body: raw }
      )
    }
    await config.tokenStore.setGuestToken?.(
      payload.guest_token,
      payload.user_id
    )
    return payload.guest_token
  }

  async function chatApiFetch(
    subpath: string,
    init: RequestInit = {}
  ): Promise<Response> {
    const accessToken = await config.tokenStore.getAccessToken()
    const url = chatApiPath(config.baseUrl, subpath)

    const doFetch = (token: string | null) =>
      fetch(url, {
        ...init,
        credentials,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers as Record<string, string> | undefined),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

    if (accessToken) {
      let res = await doFetch(accessToken)
      if (res.status === 401 && config.refreshAccessToken) {
        try {
          const pair = await config.refreshAccessToken()
          await config.tokenStore.setAccessToken(
            pair.access_token,
            pair.expires_at
          )
          res = await doFetch(pair.access_token)
        } catch {
          await config.tokenStore.clearAccessToken()
        }
        if (res.status === 401) {
          await config.tokenStore.clearAccessToken()
          config.onSessionExpired?.()
        }
      } else if (res.status === 401) {
        await config.tokenStore.clearAccessToken()
        config.onSessionExpired?.()
      }
      return res
    }

    let guest = (await config.tokenStore.getGuestToken?.()) ?? null
    if (!guest) guest = await ensureGuestToken()
    let res = await doFetch(guest)
    if (res.status === 401) {
      guest = await ensureGuestToken()
      res = await doFetch(guest)
    }
    return res
  }

  return { chatApiFetch, ensureGuestToken, unwrapChatPayload }
}
