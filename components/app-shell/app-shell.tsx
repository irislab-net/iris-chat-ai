"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { ChatAside } from "@/components/app-shell/chat-aside"
import { ChatAsideSkeleton } from "@/components/app-shell/shell-skeletons"
import { ContextMain } from "@/components/app-shell/context-main"
import { WebsiteToolbar } from "@/components/app-shell/website-toolbar"
import { AppViewportSync } from "@/components/app-shell/app-viewport-sync"
import { WorkspacePageIntroSheet } from "@/components/app-shell/workspace-page-info-sheet"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePathname } from "@/i18n/navigation"
import { useWorkspacePageIntro } from "@/hooks/use-mobile-workspace-page-intro"
import { useShellSidebarLayout } from "@/hooks/use-shell-sidebar-layout"
import {
  readPanelLayoutForTier,
  readShellLayoutPrefs,
  writePanelLayoutForTier,
  writeShellLayoutPrefs,
  type ChatDisplayMode,
} from "@/lib/shell-layout-prefs"
import { SHELL_SIDEBAR_COMPACT_FALLBACK } from "@/lib/shell-sidebar-layout"
import { isAppDeskPath } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Layout } from "react-resizable-panels"
import {
  resolveWorkspaceTab,
  type WorkspaceTab,
} from "@/lib/workspace-tab"
import {
  subscribeCopilotChatPrefill,
  subscribeDismissMobileChat,
  subscribeDockChat,
} from "@/lib/paper-trading/copilot-client"

type AppShellProps = {
  children: React.ReactNode
  className?: string
  defaultChatOpen?: boolean
}

function AppShell(props: AppShellProps) {
  return (
    <React.Suspense
      fallback={
        <AppShellInner {...props} workspaceTab={null} />
      }
    >
      <AppShellWithTab {...props} />
    </React.Suspense>
  )
}

function AppShellWithTab(props: AppShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const workspaceTab = isAppDeskPath(pathname)
    ? resolveWorkspaceTab(searchParams.get("tab"))
    : null
  return (
    <AppShellInner {...props} workspaceTab={workspaceTab} />
  )
}

function AppShellInner({
  children,
  className,
  defaultChatOpen = true,
  workspaceTab,
}: AppShellProps & {
  workspaceTab: WorkspaceTab | null
}) {
  const isDesktop = useIsDesktop()
  const sidebarLayout = useShellSidebarLayout()
  const shellSidebars = sidebarLayout ?? SHELL_SIDEBAR_COMPACT_FALLBACK
  const pathname = usePathname()
  const onDesk = isAppDeskPath(pathname)
  const [chatOpen, setChatOpen] = React.useState(defaultChatOpen)
  const [chatMode, setChatMode] = React.useState<ChatDisplayMode>(() =>
    onDesk ? "focused" : "docked"
  )
  const [panelLayout, setPanelLayout] = React.useState<Layout | undefined>()
  const [shellMediaHydrated, setShellMediaHydrated] = React.useState<
    null | "mobile" | "desktop"
  >(null)
  const [panelTierHydrated, setPanelTierHydrated] = React.useState<string | null>(
    null
  )

  if (isDesktop === false && shellMediaHydrated !== "mobile") {
    setShellMediaHydrated("mobile")
    setChatOpen(true)
  } else if (isDesktop === true && shellMediaHydrated !== "desktop") {
    const prefs = readShellLayoutPrefs()
    setShellMediaHydrated("desktop")
    if (onDesk) {
      setChatOpen(true)
      setChatMode("focused")
    } else {
      setChatOpen(defaultChatOpen ? (prefs.chatOpen ?? true) : false)
      setChatMode(prefs.chatMode)
    }
    setPanelLayout(readPanelLayoutForTier(shellSidebars.tier, prefs))
    setPanelTierHydrated(shellSidebars.tier)
  }

  if (
    isDesktop === true &&
    shellMediaHydrated === "desktop" &&
    panelTierHydrated !== shellSidebars.tier
  ) {
    const prefs = readShellLayoutPrefs()
    setPanelTierHydrated(shellSidebars.tier)
    setPanelLayout(readPanelLayoutForTier(shellSidebars.tier, prefs))
  }

  function persistChatOpen(next: boolean) {
    setChatOpen(next)
    writeShellLayoutPrefs({ chatOpen: next })
  }

  const resolvedChatOpen =
    isDesktop === false ? chatOpen : onDesk || chatOpen
  const resolvedChatMode: ChatDisplayMode =
    onDesk && isDesktop === true && chatMode !== "docked"
      ? "focused"
      : chatMode

  React.useEffect(() => {
    return subscribeDismissMobileChat(() => {
      setChatOpen(false)
      writeShellLayoutPrefs({ chatOpen: false })
    })
  }, [])

  function persistChatMode(next: ChatDisplayMode) {
    setChatMode(next)
    writeShellLayoutPrefs({ chatMode: next })
  }

  React.useEffect(() => {
    return subscribeDockChat(() => {
      if (isDesktop !== true) return
      persistChatMode("docked")
    })
  }, [isDesktop])

  const desktopChatEnabled =
    isDesktop === true && (onDesk || defaultChatOpen)

  React.useEffect(() => {
    if (isDesktop !== false || !resolvedChatOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") persistChatOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isDesktop, resolvedChatOpen])

  React.useEffect(() => {
    return subscribeCopilotChatPrefill((input) => {
      if (!input.openChat) return
      persistChatOpen(true)
      if (isDesktop === true) persistChatMode("docked")
    })
  }, [isDesktop])

  const toolbarProps = {
    onWorkspaceTabNavigate: () => {
      if (resolvedChatMode === "focused") persistChatMode("docked")
    },
    onCloseToChat:
      isDesktop === false ? () => persistChatOpen(true) : undefined,
  }

  const showDesktopChatDocked =
    desktopChatEnabled && resolvedChatMode === "docked"
  const showDesktopChatFocused =
    desktopChatEnabled && resolvedChatMode === "focused"
  const showDesktopSplit = showDesktopChatDocked
  const showMobileChat = isDesktop === false && resolvedChatOpen
  const { introPage, introOpen, onIntroOpenChange } = useWorkspacePageIntro({
    enabled: onDesk && isDesktop === false,
    pathname,
    workspaceTab,
    mobileIrisTab: isDesktop === false && resolvedChatOpen,
  })
  const mobileShellClearance =
    isDesktop === false && showMobileChat
      ? "calc(0.5rem + env(safe-area-inset-bottom, 0px))"
      : null

  const deskChatBooting = onDesk && isDesktop === null

  if (deskChatBooting) {
    return (
      <>
        <AppViewportSync />
        <div
          data-slot="app-shell"
          className={cn("flex h-app overflow-hidden bg-background", className)}
        >
          <ChatAsideSkeleton
            variant="focused"
            className="min-h-0 flex-1 rounded-none"
            sidebarWidth={shellSidebars.chat.minSize}
          />
        </div>
      </>
    )
  }

  const contextColumn = (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {showMobileChat ? (
          <ChatAside
            className="rounded-none"
            onClose={() => persistChatOpen(false)}
          />
        ) : (
          <>
            <WebsiteToolbar {...toolbarProps} />
            <ContextMain>{children}</ContextMain>
          </>
        )}
      </div>
      {mobileShellClearance ? (
        <div
          aria-hidden
          className="shrink-0 lg:hidden"
          style={{ height: mobileShellClearance }}
        />
      ) : null}
    </div>
  )

  return (
    <>
    <AppViewportSync />
    <div
      data-slot="app-shell"
      className={cn(
        "flex h-app overflow-hidden bg-background",
        className
      )}
    >
      {showDesktopChatFocused ? (
        <ChatAside
          className="min-h-0 flex-1 rounded-none"
          displayMode="focused"
          onDisplayModeChange={persistChatMode}
        />
      ) : showDesktopSplit ? (
        <ResizablePanelGroup
          key={shellSidebars.tier}
          id={`shell-${shellSidebars.tier}`}
          orientation="horizontal"
          className="min-h-0 min-w-0 flex-1"
          defaultLayout={panelLayout}
          onLayoutChanged={(layout, meta) => {
            if (!meta.isUserInteraction) return
            setPanelLayout(layout)
            writePanelLayoutForTier(shellSidebars.tier, layout)
          }}
        >
            {showDesktopChatDocked ? (
              <>
                <ResizablePanel
                  id="chat"
                  defaultSize={shellSidebars.chat.defaultSize}
                  minSize={shellSidebars.chat.minSize}
                  maxSize={shellSidebars.chat.maxSize}
                  className="min-h-0 overflow-hidden"
                >
                  <ChatAside
                    displayMode="docked"
                    onDisplayModeChange={persistChatMode}
                  />
                </ResizablePanel>
                <ResizableHandle className="w-2 bg-transparent after:w-2" />
              </>
            ) : null}
            <ResizablePanel
              id="context"
              minSize={shellSidebars.contextMinSize}
              className="min-h-0 min-w-0"
            >
              {contextColumn}
            </ResizablePanel>
          </ResizablePanelGroup>
      ) : (
        contextColumn
      )}

      <WorkspacePageIntroSheet
        page={introPage}
        open={introOpen}
        onOpenChange={onIntroOpenChange}
      />
    </div>
    </>
  )
}

export { AppShell }
