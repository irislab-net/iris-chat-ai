import {
  AUTH_PRIVACY_NOTICE_ACCEPTED,
  AUTH_TERMS_ACCEPTED,
} from "@/lib/legal"

export { CHAT_API_ORIGIN } from "@/lib/api/origins"

export const API_BASE = "https://api.exur.ai"

const CHAT_APP_HOST = "chat.irislab.info"

/** Auth cookie calls must be same-origin (via app route proxy) so Domain=.irislab.info cookies are sent. */
export const AUTH_API_BASE = ""

/** Chat deployment uses `app=chat` OAuth on api.exur.ai (not destination=). */
export function isChatAppHost(hostname?: string | null) {
  if (hostname) return hostname === CHAT_APP_HOST
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromEnv) {
    try {
      return new URL(fromEnv).hostname === CHAT_APP_HOST
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined") {
    return window.location.hostname === CHAT_APP_HOST
  }
  return true
}

/** Where Google OAuth should send the browser after login. */
export function getAuthDestination() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromEnv) return `${fromEnv}/auth/success`

  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/success`
  }

  return "https://chat.irislab.info/auth/success"
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
