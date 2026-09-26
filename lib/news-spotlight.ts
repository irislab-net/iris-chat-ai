const STORAGE_KEY = "iris-news-spotlight-v1"
const CHANGE_EVENT = "iris-news-spotlight"

export type NewsSpotlightState = {
  newsOpened?: true
  menuOpened?: true
}

export const EMPTY_NEWS_SPOTLIGHT_STATE: NewsSpotlightState = {}

const MENU_OPENED_NEWS_SPOTLIGHT_STATE: NewsSpotlightState = {
  menuOpened: true,
}
const NEWS_OPENED_NEWS_SPOTLIGHT_STATE: NewsSpotlightState = {
  newsOpened: true,
}
const COMPLETE_NEWS_SPOTLIGHT_STATE: NewsSpotlightState = {
  menuOpened: true,
  newsOpened: true,
}

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  )
}

function normalizeNewsSpotlightState(
  raw: NewsSpotlightState
): NewsSpotlightState {
  const newsOpened = raw.newsOpened === true
  const menuOpened = raw.menuOpened === true

  if (newsOpened && menuOpened) return COMPLETE_NEWS_SPOTLIGHT_STATE
  if (newsOpened) return NEWS_OPENED_NEWS_SPOTLIGHT_STATE
  if (menuOpened) return MENU_OPENED_NEWS_SPOTLIGHT_STATE
  return EMPTY_NEWS_SPOTLIGHT_STATE
}

let cachedSnapshotKey = ""
let cachedSnapshot: NewsSpotlightState = EMPTY_NEWS_SPOTLIGHT_STATE

function readRawStorageKey(): string {
  if (!canUseStorage()) return ""
  return window.localStorage.getItem(STORAGE_KEY) ?? ""
}

function readState(): NewsSpotlightState {
  const raw = readRawStorageKey()
  if (raw === cachedSnapshotKey) return cachedSnapshot

  cachedSnapshotKey = raw
  if (!raw) {
    cachedSnapshot = EMPTY_NEWS_SPOTLIGHT_STATE
    return cachedSnapshot
  }

  try {
    const parsed = JSON.parse(raw) as NewsSpotlightState
    cachedSnapshot = normalizeNewsSpotlightState(
      parsed && typeof parsed === "object" ? parsed : {}
    )
  } catch {
    cachedSnapshot = EMPTY_NEWS_SPOTLIGHT_STATE
  }

  return cachedSnapshot
}

function writeState(state: NewsSpotlightState) {
  if (!canUseStorage()) return

  const normalized = normalizeNewsSpotlightState(state)
  const serialized = JSON.stringify(normalized)

  if (normalized === EMPTY_NEWS_SPOTLIGHT_STATE) {
    window.localStorage.removeItem(STORAGE_KEY)
    cachedSnapshotKey = ""
  } else {
    window.localStorage.setItem(STORAGE_KEY, serialized)
    cachedSnapshotKey = serialized
  }

  cachedSnapshot = normalized
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getNewsSpotlightState(): NewsSpotlightState {
  return readState()
}

export function isNewsSpotlightDismissed(): boolean {
  return readState().newsOpened === true
}

export function dismissNewsSpotlight() {
  const state = readState()
  if (state.newsOpened) return
  writeState({ ...state, newsOpened: true })
}

export function acknowledgeNewsSpotlightMenu() {
  const state = readState()
  if (state.newsOpened || state.menuOpened) return
  writeState({ ...state, menuOpened: true })
}

export function subscribeNewsSpotlight(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
  }
}
