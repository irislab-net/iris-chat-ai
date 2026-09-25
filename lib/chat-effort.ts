export const CHAT_EFFORTS = ["instant", "high"] as const

export type ChatEffort = (typeof CHAT_EFFORTS)[number]

/** Fast replies — default for every new chat / prompt session. */
export const DEFAULT_CHAT_EFFORT: ChatEffort = "instant"

const STORAGE_KEY = "iris-chat-effort"
const LEGACY_TWO_MODE_MIGRATION_KEY = "iris-chat-effort-fast-thinking-v1"

export const CHAT_EFFORT_OPTIONS: {
  value: ChatEffort
}[] = [{ value: "instant" }, { value: "high" }]

export function isChatEffort(value: unknown): value is ChatEffort {
  return (
    typeof value === "string" &&
    (CHAT_EFFORTS as readonly string[]).includes(value)
  )
}

/** Map legacy stored values onto the two-mode model. */
export function normalizeChatEffort(value: unknown): ChatEffort {
  if (value === "high") return "high"
  // "medium" / unknown / "instant" → Fast
  return DEFAULT_CHAT_EFFORT
}

export function readChatEffort(): ChatEffort {
  if (typeof window === "undefined") return DEFAULT_CHAT_EFFORT
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const migrated = window.localStorage.getItem(LEGACY_TWO_MODE_MIGRATION_KEY)

    if (!migrated) {
      window.localStorage.setItem(LEGACY_TWO_MODE_MIGRATION_KEY, "1")
      // Drop the old three-mode default ("medium" / Normal) → Fast.
      if (raw === "medium" || raw === "normal") {
        window.localStorage.setItem(STORAGE_KEY, DEFAULT_CHAT_EFFORT)
        return DEFAULT_CHAT_EFFORT
      }
    }

    return normalizeChatEffort(raw)
  } catch {
    // ignore
  }
  return DEFAULT_CHAT_EFFORT
}

export function writeChatEffort(value: ChatEffort) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, normalizeChatEffort(value))
  } catch {
    // ignore
  }
}
