import { AUTH_PRIVACY_NOTICE_ACCEPTED, AUTH_TERMS_ACCEPTED } from "@/lib/legal"
import {
  CHAT_APP_ORIGIN,
  isMarketingHost,
  isProductionChatHost,
} from "@/lib/hosts"

export { CHAT_API_ORIGIN } from "@/lib/api/origins"

export const API_BASE = "https://api.exur.ai"

/** Google OAuth web client ID — required for One Tap (GIS). */
export function getGoogleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? ""
}

export function isGoogleOneTapConfigured() {
  return Boolean(getGoogleClientId())
}

/**
 * Auto One Tap (FedCM) is off in local Next.js by default.
 * GIS logs `FedCM get() NetworkError` when `https://local.exur.ai:3000`
 * is missing from the OAuth client's Authorized JavaScript origins.
 * Opt in after adding that origin: NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP_DEV=1
 */
export function isGoogleOneTapAutoPromptAllowed() {
  if (process.env.NODE_ENV === "production") return true
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP_DEV === "1"
}

/** Auth cookie calls must be same-origin (via app route proxy) so Domain=.exur.ai cookies are sent. */
export const AUTH_API_BASE = ""

function resolveRequestHostname(hostname?: string | null): string | null {
  if (hostname) return hostname
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromEnv) {
    try {
      return new URL(fromEnv).hostname
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined") {
    return window.location.hostname
  }
  return null
}

/**
 * Product OAuth uses `app=chat` on api.exur.ai.
 * True on chat.exur.ai and marketing apex (login from landing still opens the chat app).
 */
export function isChatAppHost(hostname?: string | null) {
  const host = resolveRequestHostname(hostname)
  if (host) {
    return isProductionChatHost(host) || isMarketingHost(host)
  }
  return true
}

/** Where Google OAuth should send the browser after login — always the chat app in production. */
export function getAuthDestination() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromEnv) {
    try {
      const host = new URL(fromEnv).hostname
      if (isMarketingHost(host)) return `${CHAT_APP_ORIGIN}/auth/success`
      return `${fromEnv}/auth/success`
    } catch {
      return `${fromEnv}/auth/success`
    }
  }

  if (typeof window !== "undefined") {
    if (isMarketingHost(window.location.hostname)) {
      return `${CHAT_APP_ORIGIN}/auth/success`
    }
    return `${window.location.origin}/auth/success`
  }

  return `${CHAT_APP_ORIGIN}/auth/success`
}

export function loginWithGoogleUrl(
  destination: string | null,
  options?: {
    ref?: string
    /** Required for new sessions — backend expects both accepted. */
    legalAccepted?: boolean
    /** Shorthand return target — e.g. chat OAuth uses `app=chat`. */
    app?: string
  }
) {
  // Login MUST hit the API host so pkce_verifier_google + destination cookies are set on api.exur.ai
  const url = new URL(`${API_BASE}/v1/auth/google/login`)
  if (options?.app) {
    url.searchParams.set("app", options.app)
  } else if (destination) {
    url.searchParams.set("destination", destination)
  }
  if (options?.ref) url.searchParams.set("ref", options.ref)
  if (options?.legalAccepted) {
    url.searchParams.set("terms", AUTH_TERMS_ACCEPTED)
    url.searchParams.set("privacy_notice", AUTH_PRIVACY_NOTICE_ACCEPTED)
  }
  return url.toString()
}

export function authUrl(path: string) {
  return `${AUTH_API_BASE}${path}`
}
