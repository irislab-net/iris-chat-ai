/** Viewports at or below this width use compact sidebar defaults (laptop / scaled desktop). */
export const SHELL_SIDEBAR_COMPACT_MAX_WIDTH = 1919

export type ShellSidebarTier = "compact" | "comfortable"

export type ShellSidebarPanelSizes = {
  defaultSize: string
  minSize: string
  maxSize: string
}

export type ShellSidebarLayout = {
  tier: ShellSidebarTier
  chat: ShellSidebarPanelSizes
  ticket: ShellSidebarPanelSizes
  /** Minimum width share reserved for the main workspace column. */
  contextMinSize: string
}

const COMPACT_LAYOUT: ShellSidebarLayout = {
  tier: "compact",
  chat: {
    defaultSize: "15rem",
    minSize: "15rem",
    maxSize: "22rem",
  },
  ticket: {
    defaultSize: "14rem",
    minSize: "14rem",
    maxSize: "18rem",
  },
  contextMinSize: "45%",
}

const COMFORTABLE_LAYOUT: ShellSidebarLayout = {
  tier: "comfortable",
  chat: {
    defaultSize: "18rem",
    minSize: "15rem",
    maxSize: "28rem",
  },
  ticket: {
    defaultSize: "16rem",
    minSize: "14rem",
    maxSize: "20rem",
  },
  contextMinSize: "35%",
}

export function shellSidebarLayoutForWidth(width: number): ShellSidebarLayout {
  return width <= SHELL_SIDEBAR_COMPACT_MAX_WIDTH
    ? COMPACT_LAYOUT
    : COMFORTABLE_LAYOUT
}

export const SHELL_SIDEBAR_COMPACT_FALLBACK = COMPACT_LAYOUT
