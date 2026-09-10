"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

import { ChatAside } from "@/components/app-shell/chat-aside"
import { ContextMain } from "@/components/app-shell/context-main"
import { WebsiteToolbar } from "@/components/app-shell/website-toolbar"
import { AppViewportSync } from "@/components/app-shell/app-viewport-sync"
import { MobileBottomNav } from "@/components/app-shell/mobile-bottom-nav"
import { WorkspacePageIntroSheet } from "@/components/app-shell/workspace-page-info-sheet"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useWorkspacePageIntro } from "@/hooks/use-mobile-workspace-page-intro"
import { useShellSidebarLayout } from "@/hooks/use-shell-sidebar-layout"
import { idlePrefetch } from "@/lib/idle-prefetch"
import {
  readPanelLayoutForTier,
  readShellLayoutPrefs,
  writePanelLayoutForTier,
  writeShellLayoutPrefs,
  type ChatDisplayMode,
} from "@/lib/shell-layout-prefs"
import { SHELL_SIDEBAR_COMPACT_FALLBACK } from "@/lib/shell-sidebar-layout"
import { cn } from "@/lib/utils"
import type { Layout } from "react-resizable-panels"
import { trackProductTour } from "@/lib/analytics"
import {
  resolveWorkspaceTab,
  WORKSPACE_TAB_NEWS,
  workspaceTabHref,
  type WorkspaceTab,
} from "@/lib/workspace-tab"
import { subscribeDismissMobileChat } from "@/lib/paper-trading/copilot-client"
import {
  hasSeenProductTour,
  markProductTourSeen,
  TOUR_AUTO_OPEN_DELAY_MS,
  type TourStep,
} from "@/lib/product-tour"
import { subscribeCopilotChatPrefill } from "@/lib/paper-trading/copilot-client"

const ProductTour = dynamic(() =>
  import("@/components/app-shell/product-tour").then((m) => m.ProductTour)
)

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
  const workspaceTab =
    pathname === "/app"
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
  const router = useRouter()
  const [chatOpen, setChatOpen] = React.useState(false)
  const [chatMode, setChatMode] = React.useState<ChatDisplayMode>("docked")
  const [panelLayout, setPanelLayout] = React.useState<Layout | undefined>()
  const [tourOpen, setTourOpen] = React.useState(false)
  const [tourTrigger, setTourTrigger] = React.useState<"auto" | "manual">(
    "auto"
  )
  const [shellMediaHydrated, setShellMediaHydrated] = React.useState<
    null | "mobile" | "desktop"
  >(null)
  const [panelTierHydrated, setPanelTierHydrated] = React.useState<string | null>(
    null
  )

  if (isDesktop === false && shellMediaHydrated !== "mobile") {
    setShellMediaHydrated("mobile")
    setChatOpen(false)
  } else if (isDesktop === true && shellMediaHydrated !== "desktop") {
    const prefs = readShellLayoutPrefs()
    setShellMediaHydrated("desktop")
    setChatOpen(defaultChatOpen ? (prefs.chatOpen ?? true) : false)
    setChatMode(prefs.chatMode)
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

  const desktopChatEnabled =
    isDesktop === true && (pathname === "/app" || defaultChatOpen)

  React.useEffect(() => {
    if (hasSeenProductTour()) return
    return idlePrefetch(() => import("@/components/app-shell/product-tour"))
  }, [])

  React.useEffect(() => {
    if (pathname !== "/app") return
    if (hasSeenProductTour()) return
    if (isDesktop !== true) return
    const id = window.setTimeout(() => {
      setTourTrigger("auto")
      setTourOpen(true)
      trackProductTour("start", { trigger: "auto" })
    }, TOUR_AUTO_OPEN_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [pathname, isDesktop])

  React.useEffect(() => {
    if (isDesktop !== false || !chatOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") persistChatOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isDesktop, chatOpen])

  React.useEffect(() => {
    return subscribeCopilotChatPrefill((input) => {
      if (!input.openChat) return
      persistChatOpen(true)
      if (isDesktop === true) persistChatMode("docked")
    })
  }, [isDesktop])

  const prepareTourStep = React.useEffectEvent(async (step: TourStep) => {
    if (step.closeChat) persistChatOpen(false)
    if (
      pathname === "/app" &&
      step.workspaceTab &&
      workspaceTab !== step.workspaceTab
    ) {
      router.replace(workspaceTabHref(step.workspaceTab), { scroll: false })
      await new Promise((r) => window.setTimeout(r, 180))
    }
    if (step.openChat) {
      persistChatOpen(true)
      persistChatMode("docked")
      await new Promise((r) => window.setTimeout(r, 320))
    }
  })

  function startTour() {
    void import("@/components/app-shell/product-tour")
    if (pathname === "/app" && workspaceTab !== WORKSPACE_TAB_NEWS) {
      router.replace(workspaceTabHref(WORKSPACE_TAB_NEWS), { scroll: false })
    }
    setTourTrigger("manual")
    setTourOpen(true)
    trackProductTour("start", { trigger: "manual" })
  }

  function onTourOpenChange(open: boolean) {
    setTourOpen(open)
    if (!open) markProductTourSeen()
  }

  const toolbarProps = {
    onStartTour: startTour,
    onWorkspaceTabNavigate: () => {
      if (chatMode === "focused") persistChatMode("docked")
    },
  }

  const showDesktopChatDocked =
    desktopChatEnabled && chatMode === "docked"
  const showDesktopChatFocused =
    desktopChatEnabled && chatMode === "focused"
  const showDesktopSplit = showDesktopChatDocked
  const showMobileChat = isDesktop === false && chatOpen
  const { introPage, introOpen, onIntroOpenChange } = useWorkspacePageIntro({
    enabled: pathname === "/app" && isDesktop === false,
    pathname,
    workspaceTab,
    mobileIrisTab: isDesktop === false && chatOpen,
  })
  const mobileShellClearance =
    isDesktop === false
      ? showMobileChat
        ? "calc(0.5rem + env(safe-area-inset-bottom))"
        : "var(--mobile-app-nav-height)"
      : null

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
          onStartTour={startTour}
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

      {tourOpen ? (
        <ProductTour
          open={tourOpen}
          onOpenChange={onTourOpenChange}
          onPrepareStep={prepareTourStep}
          trigger={tourTrigger}
        />
      ) : null}
      <React.Suspense fallback={null}>
        <MobileBottomNav
          hidden={showMobileChat}
          chatActive={showMobileChat}
          onOpenChat={() => persistChatOpen(true)}
          onCloseChat={() => persistChatOpen(false)}
        />
      </React.Suspense>
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
