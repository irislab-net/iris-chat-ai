import { clearStoredTokens } from "@/lib/api/auth"
import { clearChatStore, discardLegacyGlobalChatStore } from "@/lib/chat-storage"
import { resetPaperStore } from "@/lib/paper-trading/store"

export const SESSION_RESET_EVENT = "iris-session-reset"

export type SessionResetDetail = {
  userId?: string
}

/** Drop client-side session artifacts so logout cannot leak into guest mode. */
export function resetClientSessionOnLogout(detail?: SessionResetDetail): void {
  if (typeof window === "undefined") return

  clearStoredTokens()
  discardLegacyGlobalChatStore()
  clearChatStore(null)
  resetPaperStore()

  window.dispatchEvent(
    new CustomEvent<SessionResetDetail>(SESSION_RESET_EVENT, { detail })
  )
}
