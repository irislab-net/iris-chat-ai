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

/** Windows classic scrollbars eat into the rail — give chat history a bit more room. */
const COMPACT_LAYOUT_WINDOWS: ShellSidebarLayout = {
  ...COMPACT_LAYOUT,
  chat: {
    defaultSize: "16.5rem",
    minSize: "16.5rem",
    maxSize: "23.5rem",
  },
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

const COMFORTABLE_LAYOUT_WINDOWS: ShellSidebarLayout = {
  ...COMFORTABLE_LAYOUT,
  chat: {
    defaultSize: "19.5rem",
    minSize: "16.5rem",
    maxSize: "29.5rem",
  },
}

export function isWindowsUserAgent(
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  return /Windows/i.test(userAgent)
}

export function shellSidebarLayoutForWidth(
  width: number,
  options?: { windows?: boolean }
): ShellSidebarLayout {
  const windows = options?.windows === true
  if (width <= SHELL_SIDEBAR_COMPACT_MAX_WIDTH) {
    return windows ? COMPACT_LAYOUT_WINDOWS : COMPACT_LAYOUT
  }
  return windows ? COMFORTABLE_LAYOUT_WINDOWS : COMFORTABLE_LAYOUT
}

export const SHELL_SIDEBAR_COMPACT_FALLBACK = COMPACT_LAYOUT
