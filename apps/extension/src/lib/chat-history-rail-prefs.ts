const STORAGE_KEY = "iris-chat-history-rail-collapsed"

export function readHistoryRailCollapsed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function writeHistoryRailCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false")
  } catch {
    // ignore
  }
}

/** Icon-only history rail width. */
export const CHAT_HISTORY_RAIL_COLLAPSED_WIDTH = "3.75rem"
