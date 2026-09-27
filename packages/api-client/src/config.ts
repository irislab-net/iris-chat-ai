/** Injectable token storage — web uses sessionStorage; extension uses chrome.storage. */
export type TokenStore = {
  getAccessToken: () => string | null | Promise<string | null>
  setAccessToken: (token: string, expiresAt: string) => void | Promise<void>
  clearAccessToken: () => void | Promise<void>
  getGuestToken?: () => string | null | Promise<string | null>
  setGuestToken?: (token: string, userId: string) => void | Promise<void>
  clearGuestToken?: () => void | Promise<void>
}

export type ApiClientConfig = {
  /**
   * Absolute API origin (e.g. `https://api.exur.ai`) or empty string for
   * same-origin relative paths (web `/v1` proxy).
   */
  baseUrl: string
  /** When true, fetch sends cookies (web same-origin proxy). Extension: false. */
  credentials?: RequestCredentials
  tokenStore: TokenStore
  /**
   * Optional refresh for authed sessions. Web: cookie refresh via `/v1/auth/refresh`.
   * Extension: refresh with stored refresh_token body (see extension auth).
   */
  refreshAccessToken?: () => Promise<{
    access_token: string
    expires_at: string
  }>
  onSessionExpired?: () => void
}

export function resolveApiUrl(baseUrl: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const base = baseUrl.replace(/\/$/, "")
  if (!base) return normalized
  return `${base}${normalized}`
}

export function chatApiPath(baseUrl: string, subpath: string): string {
  const path = subpath.startsWith("/") ? subpath : `/${subpath}`
  return resolveApiUrl(baseUrl, `/v1/chat${path}`)
}
