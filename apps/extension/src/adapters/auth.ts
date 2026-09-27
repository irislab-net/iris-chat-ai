/**
 * Extension Google sign-in via chrome.identity + existing `/v1/auth/google/one-tap`.
 *
 * Why the old flow failed:
 * - It called `/v1/auth/google/login?app=extension` and expected tokens in the
 *   redirect URL. The API does not implement that yet (web uses cookies).
 *
 * This flow:
 * 1. Google OIDC `id_token` via `chrome.identity.launchWebAuthFlow`
 * 2. Exchange with `POST /v1/auth/google/one-tap` (same as GIS One Tap on web)
 * 3. Store access (+ refresh if returned) in chrome.storage
 *
 * Google Cloud Console: add Authorized redirect URI
 *   `https://<EXTENSION_ID>.chromiumapp.org/`
 * on the same OAuth Web client as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
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

const TERMS_ACCEPTED = "accepted"
const PRIVACY_ACCEPTED = "accepted"

function getGoogleClientId(): string {
  const fromVite = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const fromDefine = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  return (fromVite || fromDefine || "").trim()
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

function randomNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/** Google OIDC id_token via chrome.identity. */
async function fetchGoogleIdToken(): Promise<string> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new Error(
      "Missing Google Client ID. Set VITE_GOOGLE_CLIENT_ID (same value as NEXT_PUBLIC_GOOGLE_CLIENT_ID)."
    )
  }

  const redirectUrl = chrome.identity.getRedirectURL()
  const nonce = randomNonce()
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("response_type", "id_token")
  authUrl.searchParams.set("redirect_uri", redirectUrl)
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("nonce", nonce)
  authUrl.searchParams.set("prompt", "select_account")

  let responseUrl: string | undefined
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/canceled|cancelled|user cancelled/i.test(message)) {
      throw new Error("Sign-in cancelled")
    }
    throw new Error(
      `${message}\n\nAdd this redirect URI in Google Cloud Console:\n${redirectUrl}`
    )
  }

  if (!responseUrl) throw new Error("Sign-in cancelled")

  const parsed = new URL(responseUrl)
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""))
  const idToken =
    hash.get("id_token") ?? parsed.searchParams.get("id_token")
  if (!idToken) {
    throw new Error(
      `Google did not return an id_token. Check redirect URI is exactly:\n${redirectUrl}`
    )
  }
  return idToken
}

async function exchangeIdToken(credential: string) {
  const url = resolveApiUrl(API_ORIGIN, "/v1/auth/google/one-tap")
  const res = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      credential,
      app: "chat",
      terms: TERMS_ACCEPTED,
      privacy_notice: PRIVACY_ACCEPTED,
    }),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(
      new Error(
        typeof payload.error === "string"
          ? payload.error
          : `Google sign-in failed (${res.status})`
      ),
      { status: res.status, body: payload }
    )
  }

  if (
    payload &&
    typeof payload === "object" &&
    "access_token" in payload &&
    typeof (payload as { access_token?: unknown }).access_token === "string"
  ) {
    return parseTokenPair(payload)
  }

  if (payload?.data) {
    return parseTokenPair(payload.data)
  }

  throw new Error(
    "API did not return access_token from one-tap. Check CORS on api.exur.ai for chrome-extension origins."
  )
}

export async function loginWithGoogle(): Promise<void> {
  const idToken = await fetchGoogleIdToken()
  const pair = await exchangeIdToken(idToken)
  await storeAuthTokens(pair)
  await chromeTokenStore.clearGuestToken?.()
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

export function getExtensionOAuthRedirectUrl() {
  try {
    return chrome.identity.getRedirectURL()
  } catch {
    return ""
  }
}
