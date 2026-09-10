export const WORKSPACE_TAB_NEWS = "news"

export const WORKSPACE_TABS = [WORKSPACE_TAB_NEWS] as const

export type WorkspaceTab = (typeof WORKSPACE_TABS)[number]

export function parseWorkspaceTab(
  value: string | null | undefined
): WorkspaceTab | null {
  if (value === WORKSPACE_TAB_NEWS) return value
  return null
}

/** Default workspace when `/app` has no (valid) `tab` query param. */
export function resolveWorkspaceTab(
  value: string | null | undefined,
  fallback: WorkspaceTab = WORKSPACE_TAB_NEWS
): WorkspaceTab {
  return parseWorkspaceTab(value) ?? fallback
}

export function workspaceTabHref(tab: WorkspaceTab = WORKSPACE_TAB_NEWS) {
  return `/app?tab=${tab}`
}

type AppSearchParams = Record<string, string | string[] | undefined>

/** Canonical `/app` URL with tab and optional extra query params preserved. */
export function appPathWithTab(
  tab: WorkspaceTab = WORKSPACE_TAB_NEWS,
  extra?: AppSearchParams
) {
  const qs = new URLSearchParams()
  qs.set("tab", tab)
  if (extra) {
    for (const [key, val] of Object.entries(extra)) {
      if (key === "tab") continue
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item) qs.append(key, item)
        }
      } else if (val) {
        qs.set(key, val)
      }
    }
  }
  return `/app?${qs.toString()}`
}
