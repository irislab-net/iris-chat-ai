"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

import {
  MAIN_CONTENT_ID,
  SkipToContent,
} from "@/components/landing/modern/skip-to-content"
import { ChatGeminiCssLazy } from "@/components/app-shell/chat-gemini-css-lazy"
import { ChatAsideSkeleton } from "@/components/app-shell/shell-skeletons"
import { DeskBottomNav } from "@/components/app-shell/desk-bottom-nav"
import { DeskContextSidebar } from "@/components/app-shell/desk-context-sidebar"
import { AppViewportSync } from "@/components/app-shell/app-viewport-sync"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { markPlanUpgradePendingRefresh } from "@/lib/api/auth"
import { useShellSidebarLayout } from "@/hooks/use-shell-sidebar-layout"
import {
  readPanelLayoutForTier,
  readShellLayoutPrefs,
  writePanelLayoutForTier,
  writeShellLayoutPrefs,
  type ChatDisplayMode,
} from "@/lib/shell-layout-prefs"
import { SHELL_SIDEBAR_COMPACT_FALLBACK } from "@/lib/shell-sidebar-layout"
import { isAppDeskPath, isDeskAiPath } from "@/lib/site"
import { cn } from "@/lib/utils"
import { trackChatToggle } from "@/lib/analytics"
import type { Layout } from "react-resizable-panels"

/**
 * Floating desk bottom nav clearance (island height + float gap).
 * Safe-area is added separately on composer / content pads.
 */
const DESK_BOTTOM_NAV_OFFSET = "5.5rem"

const ChatAside = dynamic(
  () => import("@/components/app-shell/chat-aside").then((m) => m.ChatAside),
  {
    ssr: false,
    loading: () => <ChatAsideSkeleton variant="responsive" />,
  }
)

const WebsiteToolbar = dynamic(
  () =>
    import("@/components/app-shell/website-toolbar").then(
      (m) => m.WebsiteToolbar
    ),
  { ssr: false }
)

const ContextMain = dynamic(
  () =>
    import("@/components/app-shell/context-main").then((m) => m.ContextMain),
  { ssr: false }
)

const ResizablePanelGroup = dynamic(
  () => import("@/components/ui/resizable").then((m) => m.ResizablePanelGroup),
  { ssr: false }
)
const ResizablePanel = dynamic(
  () => import("@/components/ui/resizable").then((m) => m.ResizablePanel),
  { ssr: false }
)
const ResizableHandle = dynamic(
  () => import("@/components/ui/resizable").then((m) => m.ResizableHandle),
  { ssr: false }
)

type AppShellProps = {
  children: React.ReactNode
  className?: string
  defaultChatOpen?: boolean
}

function AppShell(props: AppShellProps) {
  return (
    <React.Suspense fallback={<AppShellInner {...props} />}>
      <AppShellWithTab {...props} />
    </React.Suspense>
  )
}

function AppShellWithTab(props: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    refreshAfterUpgrade,
    isAuthenticated,
    loading: authLoading,
  } = useAuth()
  const checkoutHandledRef = React.useRef(false)

  React.useEffect(() => {
    if (searchParams.get("checkout") !== "success") return
    if (checkoutHandledRef.current) return
    // Wait until auth settles — otherwise we strip ?checkout=success while
    // still loading and skip the token refresh that Plus chat needs.
    if (authLoading) return
    checkoutHandledRef.current = true

    void (async () => {
      try {
        if (isAuthenticated) {
          markPlanUpgradePendingRefresh()
          await refreshAfterUpgrade()
        }
      } catch {
        // Keep pending-refresh flag for ChatAside / next bootstrap.
      } finally {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("checkout")
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname)
      }
    })()
  }, [
    authLoading,
    isAuthenticated,
    pathname,
    refreshAfterUpgrade,
    router,
    searchParams,
  ])

  return <AppShellInner {...props} />
}

function AppShellInner({
  children,
  className,
  defaultChatOpen = true,
}: AppShellProps) {
  const isDesktop = useIsDesktop()
  const sidebarLayout = useShellSidebarLayout()
  const shellSidebars = sidebarLayout ?? SHELL_SIDEBAR_COMPACT_FALLBACK
  const pathname = usePathname()
  const onDesk = isAppDeskPath(pathname)
  const onAi = isDeskAiPath(pathname)
  const [chatOpen, setChatOpen] = React.useState(defaultChatOpen)
  /** Mobile: hide desk bottom nav while a chat thread has messages. */
  const [mobileThreadActive, setMobileThreadActive] = React.useState(false)
  const [chatMode, setChatMode] = React.useState<ChatDisplayMode>(() =>
    onAi ? "focused" : "docked"
  )
  const [panelLayout, setPanelLayout] = React.useState<Layout | undefined>()
  const [shellMediaHydrated, setShellMediaHydrated] = React.useState<
    null | "mobile" | "desktop"
  >(null)
  const [panelTierHydrated, setPanelTierHydrated] = React.useState<
    string | null
  >(null)
  const chatToggleAnalyticsReady = React.useRef(false)

  React.useEffect(() => {
    chatToggleAnalyticsReady.current = true
  }, [])

  // Sync chat visibility when switching desk tabs.
  React.useEffect(() => {
    if (!onDesk) return
    if (onAi) {
      setChatOpen(true)
      if (isDesktop === true) setChatMode("focused")
    } else {
      setChatOpen(false)
    }
  }, [onAi, onDesk, isDesktop, pathname])

  if (isDesktop === false && shellMediaHydrated !== "mobile") {
    setShellMediaHydrated("mobile")
    setChatOpen(onAi)
  } else if (isDesktop === true && shellMediaHydrated !== "desktop") {
    const prefs = readShellLayoutPrefs()
    setShellMediaHydrated("desktop")
    if (onAi) {
      setChatOpen(true)
      setChatMode("focused")
    } else if (onDesk) {
      setChatOpen(false)
      setChatMode(prefs.chatMode)
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
    if (chatToggleAnalyticsReady.current) {
      trackChatToggle(next)
    }
  }

  const resolvedChatOpen =
    isDesktop === false
      ? onAi
        ? chatOpen
        : false
      : onAi || chatOpen
  const resolvedChatMode: ChatDisplayMode =
    onAi && isDesktop === true && chatMode !== "docked" ? "focused" : chatMode

  function persistChatMode(next: ChatDisplayMode) {
    setChatMode(next)
    writeShellLayoutPrefs({ chatMode: next })
  }

  const desktopChatEnabled =
    isDesktop === true && onAi && (onAi || defaultChatOpen)

  React.useEffect(() => {
    if (isDesktop !== false || !resolvedChatOpen || !onAi) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") persistChatOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isDesktop, resolvedChatOpen, onAi])

  const toolbarProps = {
    onCloseToChat:
      isDesktop === false && onAi
        ? () => persistChatOpen(true)
        : undefined,
  }

  const showDesktopChatDocked =
    desktopChatEnabled && resolvedChatMode === "docked"
  const showDesktopChatFocused =
    desktopChatEnabled && resolvedChatMode === "focused"
  const showDesktopSplit = showDesktopChatDocked
  const showMobileChat = isDesktop === false && onAi && resolvedChatOpen
  const showDeskContext = onDesk && !onAi
  // Visible on New chat + News/Markets/Trade/Profile; hidden in an active thread.
  const showBottomNav =
    onDesk && isDesktop === false && !(showMobileChat && mobileThreadActive)
  const deskChatBooting = onAi && isDesktop === null

  const deskBottomNavStyle = showBottomNav
    ? ({
        ["--desk-bottom-nav" as string]: DESK_BOTTOM_NAV_OFFSET,
      } as React.CSSProperties)
    : undefined

  React.useEffect(() => {
    if (!showMobileChat) setMobileThreadActive(false)
  }, [showMobileChat])

  if (deskChatBooting) {
    // Viewport unknown until matchMedia hydrates — CSS picks mobile vs focused
    // so narrow devices never flash the two-column desktop chrome.
    // Default to New-chat chrome (bottom nav on) until media resolves.
    return (
      <>
        <ChatGeminiCssLazy />
        <AppViewportSync />
        <SkipToContent />
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          data-slot="app-shell"
          className={cn(
            "flex h-app overflow-hidden bg-background outline-none",
            className
          )}
          style={
            {
              ["--desk-bottom-nav" as string]: DESK_BOTTOM_NAV_OFFSET,
            } as React.CSSProperties
          }
        >
          <ChatAsideSkeleton
            variant="responsive"
            className="min-h-0 flex-1 rounded-none"
            sidebarWidth={shellSidebars.chat.minSize}
          />
        </main>
        <DeskBottomNav />
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
            isPrimaryContent
            onMobileThreadActiveChange={setMobileThreadActive}
          />
        ) : (
          <>
            <WebsiteToolbar {...toolbarProps} />
            <ContextMain>{children}</ContextMain>
          </>
        )}
      </div>
    </div>
  )

  const deskContextLayout = (
    <div className="flex h-full min-h-0 min-w-0 flex-1">
      <DeskContextSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ContextMain>{children}</ContextMain>
      </div>
    </div>
  )

  return (
    <>
      <ChatGeminiCssLazy />
      <AppViewportSync />
      <SkipToContent />
      <div
        data-slot="app-shell"
        className={cn("flex h-app overflow-hidden bg-background", className)}
        style={deskBottomNavStyle}
      >
        {showDeskContext ? (
          deskContextLayout
        ) : showDesktopChatFocused ? (
          <ChatAside
            className="min-h-0 flex-1 rounded-none"
            displayMode="focused"
            onDisplayModeChange={persistChatMode}
            isPrimaryContent
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
      </div>
      {showBottomNav ? <DeskBottomNav /> : null}
    </>
  )
}

export { AppShell }
