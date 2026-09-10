const STORAGE_KEY = "iris-chat-desk-tools-banner-dismissed-until"

export const DESK_TOOLS_BANNER_SNOOZE_MS = 2 * 24 * 60 * 60 * 1000

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function readDeskToolsBannerSnoozedUntil(): number | null {
  if (!canUseStorage()) return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const until = Number(raw)
  return Number.isFinite(until) ? until : null
}

export function isDeskToolsBannerSnoozed(now = Date.now()): boolean {
  const until = readDeskToolsBannerSnoozedUntil()
  return until != null && now < until
}

export function snoozeDeskToolsBanner(
  now = Date.now(),
  snoozeMs = DESK_TOOLS_BANNER_SNOOZE_MS
) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, String(now + snoozeMs))
}
