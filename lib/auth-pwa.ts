import { isStandaloneDisplay } from "@/lib/display-mode"

/** Marks an in-flight Google OAuth attempt started from the installed PWA. */
export const AUTH_PWA_PENDING_KEY = "iris-auth-pwa-pending"
/** Survives Safari hand-off better than sessionStorage alone. */
export const AUTH_RETURN_TO_STORAGE_KEY = "iris-auth-return-to"
/** Dedupes /auth/success when iOS reloads the callback URL. */
export const AUTH_SUCCESS_PROCESSED_KEY = "iris-auth-success-processed"

const PROCESSED_TTL_MS = 10 * 60 * 1000
const MAX_PROCESSED = 12

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode / quota
  }
}

function removeLocal(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function markAuthPwaPending() {
  if (typeof window === "undefined") return
  if (!isStandaloneDisplay()) return
  writeLocal(AUTH_PWA_PENDING_KEY, String(Date.now()))
}

export function clearAuthPwaPending() {
  if (typeof window === "undefined") return
  removeLocal(AUTH_PWA_PENDING_KEY)
}

export function hasAuthPwaPending(maxAgeMs = 15 * 60 * 1000): boolean {
  if (typeof window === "undefined") return false
  const raw = readLocal(AUTH_PWA_PENDING_KEY)
  if (!raw) return false
  const started = Number(raw)
  if (!Number.isFinite(started)) {
    removeLocal(AUTH_PWA_PENDING_KEY)
    return false
  }
  if (Date.now() - started > maxAgeMs) {
    removeLocal(AUTH_PWA_PENDING_KEY)
    return false
  }
  return true
}

export function persistAuthReturnTo(path: string) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, path)
  } catch {
    // ignore
  }
  writeLocal(AUTH_RETURN_TO_STORAGE_KEY, path)
}

export function consumeAuthReturnTo(fallback: string): string {
  if (typeof window === "undefined") return fallback
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY)
  } catch {
    // ignore
  }
  if (!raw) {
    raw = readLocal(AUTH_RETURN_TO_STORAGE_KEY)
  }
  removeLocal(AUTH_RETURN_TO_STORAGE_KEY)
  return raw?.trim() || fallback
}

type ProcessedMap = Record<string, number>

function readProcessed(): ProcessedMap {
  const raw = readLocal(AUTH_SUCCESS_PROCESSED_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as ProcessedMap
  } catch {
    return {}
  }
}

function writeProcessed(map: ProcessedMap) {
  const entries = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PROCESSED)
  writeLocal(
    AUTH_SUCCESS_PROCESSED_KEY,
    JSON.stringify(Object.fromEntries(entries))
  )
}

/** Returns true if this callback id was already handled (skip re-exchange). */
export function wasAuthSuccessProcessed(id: string): boolean {
  if (typeof window === "undefined" || !id) return false
  const now = Date.now()
  const map = readProcessed()
  for (const [key, at] of Object.entries(map)) {
    if (now - at > PROCESSED_TTL_MS) delete map[key]
  }
  writeProcessed(map)
  return Boolean(map[id])
}

/** Mark callback id handled — call only after session is established (or handed off). */
export function markAuthSuccessProcessed(id: string) {
  if (typeof window === "undefined" || !id) return
  const now = Date.now()
  const map = readProcessed()
  for (const [key, at] of Object.entries(map)) {
    if (now - at > PROCESSED_TTL_MS) delete map[key]
  }
  map[id] = now
  writeProcessed(map)
}

/**
 * Atomically claim a callback id. Prefer mark-after-success on /auth/success;
 * kept for callers that need claim-before-work semantics.
 */
export function claimAuthSuccessProcessed(id: string): boolean {
  if (wasAuthSuccessProcessed(id)) return true
  markAuthSuccessProcessed(id)
  return false
}

export function authSuccessDedupeId(): string {
  if (typeof window === "undefined") return "auth-success"
  const url = new URL(window.location.href)
  return (
    url.searchParams.get("state") ||
    url.searchParams.get("code") ||
    url.searchParams.get("session_state") ||
    `${url.pathname}${url.search}`
  )
}
