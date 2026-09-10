export const CHAT_EFFORTS = ["instant", "medium", "high"] as const

export type ChatEffort = (typeof CHAT_EFFORTS)[number]

export const DEFAULT_CHAT_EFFORT: ChatEffort = "instant"

const STORAGE_KEY = "iris-chat-effort"
const LEGACY_DEFAULT_MIGRATION_KEY = "iris-chat-effort-normal-default-v1"

export const CHAT_EFFORT_OPTIONS: {
  value: ChatEffort
  label: string
  hint: string
}[] = [
  { value: "instant", label: "Normal", hint: "Fast, concise replies" },
  { value: "medium", label: "High effort", hint: "More context and detail" },
  { value: "high", label: "Deep thinking", hint: "Slowest, deepest analysis" },
]

export function isChatEffort(value: unknown): value is ChatEffort {
  return (
    typeof value === "string" &&
    (CHAT_EFFORTS as readonly string[]).includes(value)
  )
}

export function chatEffortLabel(value: ChatEffort) {
  return (
    CHAT_EFFORT_OPTIONS.find((item) => item.value === value)?.label ?? "Normal"
  )
}

export function readChatEffort(): ChatEffort {
  if (typeof window === "undefined") return DEFAULT_CHAT_EFFORT
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const migrated = window.localStorage.getItem(LEGACY_DEFAULT_MIGRATION_KEY)

    // Previous default was "medium" (High effort). Reset once so Normal is the default.
    if (!migrated && raw === "medium") {
      window.localStorage.setItem(LEGACY_DEFAULT_MIGRATION_KEY, "1")
      window.localStorage.setItem(STORAGE_KEY, DEFAULT_CHAT_EFFORT)
      return DEFAULT_CHAT_EFFORT
    }

    if (isChatEffort(raw)) return raw
  } catch {
    // ignore
  }
  return DEFAULT_CHAT_EFFORT
}

export function writeChatEffort(value: ChatEffort) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore
  }
}
