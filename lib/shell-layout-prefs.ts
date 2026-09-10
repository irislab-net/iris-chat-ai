import type { Layout } from "react-resizable-panels"

import type { ShellSidebarTier } from "@/lib/shell-sidebar-layout"

export const CHAT_DISPLAY_MODES = ["docked", "focused"] as const

export type ChatDisplayMode = (typeof CHAT_DISPLAY_MODES)[number]

export type ShellLayoutPrefs = {
  chatOpen: boolean
  chatMode: ChatDisplayMode
  panelLayouts: Partial<Record<ShellSidebarTier, Layout>>
}

const STORAGE_KEY = "iris-shell-layout-prefs"

const DEFAULT_PREFS: ShellLayoutPrefs = {
  chatOpen: true,
  chatMode: "docked",
  panelLayouts: {},
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isChatDisplayMode(value: unknown): value is ChatDisplayMode {
  return (
    typeof value === "string" &&
    (CHAT_DISPLAY_MODES as readonly string[]).includes(value)
  )
}

function isPanelLayout(value: unknown): value is Layout {
  if (!isRecord(value)) return false
  return Object.values(value).every(
    (entry) => typeof entry === "number" && Number.isFinite(entry)
  )
}

function parsePrefs(raw: string | null): ShellLayoutPrefs {
  if (!raw) return DEFAULT_PREFS
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return DEFAULT_PREFS

    const panelLayouts: Partial<Record<ShellSidebarTier, Layout>> = {}
    if (isRecord(parsed.panelLayouts)) {
      for (const tier of ["compact", "comfortable"] as const) {
        const layout = parsed.panelLayouts[tier]
        if (isPanelLayout(layout)) panelLayouts[tier] = layout
      }
    }

    return {
      chatOpen:
        typeof parsed.chatOpen === "boolean"
          ? parsed.chatOpen
          : DEFAULT_PREFS.chatOpen,
      chatMode:
        parsed.chatMode === "collapsed"
          ? "docked"
          : isChatDisplayMode(parsed.chatMode)
            ? parsed.chatMode
            : DEFAULT_PREFS.chatMode,
      panelLayouts,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function readShellLayoutPrefs(): ShellLayoutPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    return parsePrefs(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_PREFS
  }
}

export function writeShellLayoutPrefs(patch: Partial<ShellLayoutPrefs>) {
  if (typeof window === "undefined") return
  try {
    const current = readShellLayoutPrefs()
    const next: ShellLayoutPrefs = {
      chatOpen: patch.chatOpen ?? current.chatOpen,
      chatMode: patch.chatMode ?? current.chatMode,
      panelLayouts: patch.panelLayouts ?? current.panelLayouts,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function readPanelLayoutForTier(
  tier: ShellSidebarTier,
  prefs = readShellLayoutPrefs()
): Layout | undefined {
  return prefs.panelLayouts[tier]
}

export function writePanelLayoutForTier(tier: ShellSidebarTier, layout: Layout) {
  const current = readShellLayoutPrefs()
  writeShellLayoutPrefs({
    panelLayouts: {
      ...current.panelLayouts,
      [tier]: layout,
    },
  })
}
