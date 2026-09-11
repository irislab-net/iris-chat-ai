"use client"

import * as React from "react"

import { isAppDeskPath } from "@/lib/site"
import type { WorkspacePageId } from "@/lib/workspace-page-info"
import { hasSeenWorkspacePageIntro } from "@/lib/workspace-page-intro"
import {
  WORKSPACE_TAB_NEWS,
  type WorkspaceTab,
} from "@/lib/workspace-tab"

const INTRO_OPEN_DELAY_MS = 350

export function resolveWorkspaceIntroPage(input: {
  pathname: string
  workspaceTab: WorkspaceTab | null
  /** Mobile IRIS tab — full-screen chat, not the desktop chat rail. */
  mobileIrisTab: boolean
}): WorkspacePageId | null {
  if (!isAppDeskPath(input.pathname)) return null
  if (input.mobileIrisTab) return "iris"
  if (input.workspaceTab === WORKSPACE_TAB_NEWS) return "news"
  return null
}

export function useWorkspacePageIntro(input: {
  /** Pass true only on mobile (< md). Bottom sheets must not open on tablet/desktop. */
  enabled: boolean
  pathname: string
  workspaceTab: WorkspaceTab | null
  mobileIrisTab: boolean
}) {
  const { enabled, pathname, workspaceTab, mobileIrisTab } = input
  const [introPage, setIntroPage] = React.useState<WorkspacePageId | null>(null)
  const [introOpen, setIntroOpen] = React.useState(false)

  const introTarget = React.useMemo(
    () =>
      enabled
        ? resolveWorkspaceIntroPage({ pathname, workspaceTab, mobileIrisTab })
        : null,
    [enabled, mobileIrisTab, pathname, workspaceTab]
  )

  React.useEffect(() => {
    if (!enabled || !introTarget || hasSeenWorkspacePageIntro(introTarget)) {
      return
    }

    const id = window.setTimeout(() => {
      setIntroPage(introTarget)
      setIntroOpen(true)
    }, INTRO_OPEN_DELAY_MS)

    return () => window.clearTimeout(id)
  }, [enabled, introTarget])

  const onIntroOpenChange = React.useCallback((open: boolean) => {
    setIntroOpen(open)
    if (!open) setIntroPage(null)
  }, [])

  if (!enabled) {
    return { introPage: null, introOpen: false, onIntroOpenChange }
  }

  return { introPage, introOpen, onIntroOpenChange }
}
