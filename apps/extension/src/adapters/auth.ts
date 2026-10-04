/**
 * Extension Google sign-in (API PKCE tab flow only — no chrome.identity).
 *
 * Login tab: full-page redirect to
 *   GET /v1/auth/google/login?app=chromimum_extension&destination=<callback.html>&terms&privacy_notice
 * so api.exur.ai can set PKCE + HttpOnly refresh_token cookies (same as web).
 * Backend 303s to chrome-extension://…/callback.html (usually without tokens in the URL).
 * Callback reads the refresh_token cookie via chrome.cookies, exchanges it for
 * access + refresh in chrome.storage, then notifies the side panel.
 */

import {
  createChatFetch,
  parseTokenPair,
  resolveApiUrl,
  type ApiClientConfig,
} from "@exur/api-client"

import {
  chromeTokenStore,
  getStoredRefreshToken,
  storeAuthTokens,
} from "./token-store"

export const API_ORIGIN = "https://api.exur.ai"
export const CHAT_WEB_ORIGIN = "https://chat.exur.ai"

/** Backend app flag for the Chrome extension Google login redirect. */
export const EXTENSION_GOOGLE_LOGIN_APP = "chromimum_extension"

const TERMS_ACCEPTED = "accepted"
const PRIVACY_ACCEPTED = "accepted"

/** Extension page that receives tokens after Google OAuth. */
export function getExtensionAuthCallbackUrl(): string {
  try {
    return chrome.runtime.getURL("callback.html")
  } catch {
    return ""
  }
}

/** Cookie/PKCE Google login used by the web app — same endpoint, extension app id. */
export function getExtensionGoogleLoginUrl(): string {
  const url = new URL(`${API_ORIGIN}/v1/auth/google/login`)
  url.searchParams.set("app", EXTENSION_GOOGLE_LOGIN_APP)
  const destination = getExtensionAuthCallbackUrl()
  if (destination) {
    url.searchParams.set("destination", destination)
  }
  url.searchParams.set("terms", TERMS_ACCEPTED)
  url.searchParams.set("privacy_notice", PRIVACY_ACCEPTED)
  return url.toString()
}

export function createExtensionApiConfig(
  overrides?: Partial<ApiClientConfig>
): ApiClientConfig {
  return {
    baseUrl: API_ORIGIN,
    credentials: "omit",
    tokenStore: chromeTokenStore,
    refreshAccessToken: refreshWithStoredToken,
    onSessionExpired: () => {
      void chromeTokenStore.clearAccessToken()
    },
    ...overrides,
  }
}

/** Body refresh using chrome.storage refresh_token (no cookies in MV3). */
export async function refreshWithStoredToken() {
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) {
    throw new Error("No refresh token — sign in again")
  }
  return exchangeRefreshToken(refreshToken)
}

/**
 * Exchange a refresh token string for access (+ optional rotated refresh).
 * Used by storage refresh and by the OAuth callback cookie handoff.
 */
export async function exchangeRefreshToken(refreshToken: string) {
  const url = resolveApiUrl(API_ORIGIN, "/v1/auth/refresh")
  const res = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(new Error("refresh failed"), {
      status: res.status,
      body,
    })
  }
  const pair = parseTokenPair(body.data ?? body)
  await storeAuthTokens(pair)
  return pair
}

/**
 * Read the HttpOnly `refresh_token` cookie the API set during Google OAuth.
 * Path is `/v1/auth` on Domain=.exur.ai — chrome.cookies can still read HttpOnly.
 */
export async function readApiRefreshCookie(): Promise<string | null> {
  const urls = [
    `${API_ORIGIN}/v1/auth/refresh`,
    `${API_ORIGIN}/v1/auth/`,
    `${CHAT_WEB_ORIGIN}/v1/auth/refresh`,
    `${CHAT_WEB_ORIGIN}/v1/auth/`,
  ]

  for (const url of urls) {
    try {
      const cookie = await chrome.cookies.get({ url, name: "refresh_token" })
      if (cookie?.value?.trim()) return cookie.value.trim()
    } catch (err) {
      console.warn("[exur-auth] cookies.get failed", url, err)
    }
  }

  try {
    const all = await chrome.cookies.getAll({ name: "refresh_token" })
    const match = all.find(
      (cookie) =>
        cookie.value?.trim() &&
        (cookie.domain === "exur.ai" ||
          cookie.domain.endsWith(".exur.ai") ||
          cookie.domain === ".exur.ai")
    )
    if (match?.value?.trim()) return match.value.trim()
  } catch (err) {
    console.warn("[exur-auth] cookies.getAll failed", err)
  }

  return null
}

/**
 * After OAuth redirect to callback.html: mint tokens from the API refresh cookie.
 */
export async function establishSessionFromApiCookies() {
  const refreshToken = await readApiRefreshCookie()
  if (!refreshToken) {
    throw new Error(
      "No refresh cookie from api.exur.ai — sign-in may not have finished"
    )
  }
  const pair = await exchangeRefreshToken(refreshToken)
  await chromeTokenStore.clearGuestToken?.()
  return pair
}

export async function logout() {
  await chromeTokenStore.clearAccessToken()
  await chromeTokenStore.clearGuestToken?.()
}

export async function ensureGuestSession() {
  const { ensureGuestToken } = createChatFetch(createExtensionApiConfig())
  return ensureGuestToken()
}

export async function isLoggedIn() {
  return Boolean(await chromeTokenStore.getAccessToken())
}
