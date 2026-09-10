import {
  emptyPaperState,
  parsePaperState,
  PAPER_STORAGE_KEY,
} from "@/lib/paper-trading/engine"
import type { PaperState } from "@/lib/paper-trading/types"

const LEGACY_STORAGE_KEY = "iris-paper-trading-v1"

export function loadPaperState(): PaperState {
  if (typeof window === "undefined") return emptyPaperState()
  try {
    const raw = window.localStorage.getItem(PAPER_STORAGE_KEY)
    if (raw) return parsePaperState(JSON.parse(raw) as unknown)

    // One-time migrate from v1 key
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      const migrated = parsePaperState(JSON.parse(legacy) as unknown)
      savePaperState(migrated)
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      return migrated
    }
    return emptyPaperState()
  } catch {
    return emptyPaperState()
  }
}

export function savePaperState(state: PaperState): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PAPER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota / private mode — ignore.
  }
}

export function clearPaperStateStorage(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(PAPER_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Quota / private mode — ignore.
  }
}
