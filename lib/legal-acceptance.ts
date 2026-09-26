/**
 * Client-side record that the user accepted Terms + Privacy before Google login.
 * Backend still receives `terms` / `privacy_notice` on the auth request.
 * Shared across exur.ai ↔ chat.exur.ai so the modal is not re-shown needlessly.
 */

import {
  EXUR_CLIENT_STORAGE_MAX_AGE_SECONDS,
  readSharedJson,
  writeSharedJson,
} from "@/lib/exur-client-storage"
import { LEGAL_ACCEPTANCE_VERSION } from "@/lib/legal"

export const LEGAL_ACCEPTANCE_STORAGE_KEY = "exur-legal-acceptance"

export type LegalAcceptance = {
  version: string
  terms: true
  privacy: true
  timestamp: number
}

let cachedRaw: string | null | undefined
let cachedAcceptance: LegalAcceptance | null | undefined

function parseLegalAcceptance(raw: string | null): LegalAcceptance | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<LegalAcceptance>
    if (parsed.version !== LEGAL_ACCEPTANCE_VERSION) return null
    if (parsed.terms !== true || parsed.privacy !== true) return null
    return {
      version: LEGAL_ACCEPTANCE_VERSION,
      terms: true,
      privacy: true,
      timestamp:
        typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
    }
  } catch {
    return null
  }
}

function readAcceptance(): LegalAcceptance | null {
  const raw = readSharedJson(LEGAL_ACCEPTANCE_STORAGE_KEY)
  if (raw === cachedRaw) return cachedAcceptance ?? null
  cachedRaw = raw
  cachedAcceptance = parseLegalAcceptance(raw)
  return cachedAcceptance
}

/** True when the current legal docs version was already accepted on this browser. */
export function hasAcceptedCurrentLegal(): boolean {
  return readAcceptance() != null
}

export function getLegalAcceptance(): LegalAcceptance | null {
  return readAcceptance()
}

/** Persist acceptance after the login consent UI (or skip when already stored). */
export function recordLegalAcceptance(): LegalAcceptance {
  const existing = readAcceptance()
  if (existing) return existing

  const prefs: LegalAcceptance = {
    version: LEGAL_ACCEPTANCE_VERSION,
    terms: true,
    privacy: true,
    timestamp: Date.now(),
  }
  const raw = JSON.stringify(prefs)
  writeSharedJson(
    LEGAL_ACCEPTANCE_STORAGE_KEY,
    raw,
    EXUR_CLIENT_STORAGE_MAX_AGE_SECONDS
  )
  cachedRaw = raw
  cachedAcceptance = prefs
  return prefs
}

/** Test helper — clear in-memory cache after mutating storage stubs. */
export function resetLegalAcceptanceCache() {
  cachedRaw = undefined
  cachedAcceptance = undefined
}
