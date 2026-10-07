"use client"

import type { ComponentProps } from "react"
import { useTranslations } from "next-intl"

import { ChatEmptyHeroLcp } from "@/components/app-shell/chat-empty-hero-lcp"
import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import {
  chatDesktopCanvasClass,
  chatDesktopComposerShellClass,
  chatMobileComposerDockClass,
  chatMobileComposerShellClass,
  chatMobileEmptyHeroContentClass,
  chatMobileEmptyHeroWrapClass,
  chatMobileHeaderScrimClass,
  chatMobileHeaderShellClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

/** Flat shimmer bone — one surface per real UI layer. */
function Bone({
  className,
  stagger,
  ...props
}: ComponentProps<"div"> & { stagger?: 1 | 2 | 3 }) {
  return (
    <div
      aria-hidden
      className={cn(
        "chat-skeleton-shimmer",
        stagger === 1 && "chat-mobile-skeleton-stagger-1",
        stagger === 2 && "chat-mobile-skeleton-stagger-2",
        stagger === 3 && "chat-mobile-skeleton-stagger-3",
        className
      )}
      {...props}
    />
  )
}

function ChatComposerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl px-3 sm:px-4",
        chatDesktopComposerShellClass,
        className
      )}
    >
      <Bone stagger={3} className="h-20 w-full rounded-3xl" />
    </div>
  )
}

function ChatMobileHeaderSkeleton() {
  // Mirrors ChatMobileHeader empty state: menu + effort pill | account (48pt).
  return (
    <div className={chatMobileHeaderShellClass}>
      <div aria-hidden className={chatMobileHeaderScrimClass} />
      <header className="app-mobile-safe-header relative z-1 flex items-center justify-between gap-2 bg-transparent px-4 pb-2">
        <div className="flex h-11 min-w-0 items-center justify-start gap-2">
          <Bone stagger={1} className="size-11 shrink-0 rounded-full" />
          <Bone stagger={1} className="ms-1 h-6 w-20 shrink-0 rounded-full" />
        </div>
        <div className="flex shrink-0 items-center justify-end">
          <Bone stagger={1} className="size-12 shrink-0 rounded-full" />
        </div>
      </header>
    </div>
  )
}

function ChatMobileEmptyHeroSkeleton() {
  return (
    <div
      className={cn(
        chatMobileEmptyHeroWrapClass,
        "chat-empty-hero-shell chat-mobile-skeleton-hero min-h-0 flex-1"
      )}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className={chatMobileEmptyHeroContentClass}>
          <Bone stagger={1} className="size-11 shrink-0 rounded-full" />
          <Bone
            stagger={2}
            className="h-8 w-[min(16rem,72%)] max-w-64 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}

function ChatMobileComposerSkeleton() {
  return (
    <form
      data-slot="chat-composer"
      aria-hidden
      className={cn(
        "relative mx-auto w-full max-w-3xl",
        chatMobileComposerShellClass
      )}
    >
      <Bone
        stagger={3}
        className="min-h-16 w-full rounded-full"
      />
    </form>
  )
}

function ChatMobileAsideSkeleton({ className }: { className?: string }) {
  const t = useTranslations("workspace")
  return (
    <aside
      data-slot="chat-aside"
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground",
        className
      )}
      aria-busy="true"
      aria-label={t("loadingExur")}
    >
      <ChatMobileGeminiBackground visible intro tone="blue" />
      <div className="chat-mobile-gemini-empty relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent text-foreground">
        <ChatMobileHeaderSkeleton />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ChatMobileEmptyHeroSkeleton />
          <div className={cn(chatMobileComposerDockClass, "max-w-3xl")}>
            <ChatMobileComposerSkeleton />
          </div>
        </div>
      </div>
    </aside>
  )
}

function ChatPromptsSkeleton() {
  // Real starter copy (not shimmer) so desktop boot paints the LCP text early.
  return (
    <div className="chat-empty-hero-shell flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        <Bone className="size-14 shrink-0 rounded-full" />
        <Bone className="h-7 w-[min(20rem,88%)] max-w-xs rounded-full" />
        <ChatEmptyHeroLcp />
      </div>
    </div>
  )
}

function ChatHeaderSkeleton({
  mobile = false,
  showUpgrade = true,
  showFullscreen = false,
  showHistory = false,
  showNewChat = false,
  guestSubtitle = false,
}: {
  mobile?: boolean
  showUpgrade?: boolean
  showFullscreen?: boolean
  showHistory?: boolean
  showNewChat?: boolean
  /** Wider subtitle bone for guest trial copy. */
  guestSubtitle?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 shrink-0 items-center gap-1.5 px-2 sm:gap-2 sm:px-3",
        mobile && "pt-(--app-safe-top,0px)"
      )}
    >
      {mobile ? (
        <Bone stagger={1} className="size-8 shrink-0 rounded-full" />
      ) : (
        <Bone stagger={1} className="size-7 shrink-0 rounded-full" />
      )}
      <Bone
        stagger={1}
        className={cn(
          "h-8 shrink-0 rounded-full",
          guestSubtitle ? "w-40" : "w-24"
        )}
      />
      <div className="min-w-0 flex-1" />
      {showUpgrade ? (
        <Bone
          stagger={1}
          className="hidden h-7 w-16 shrink-0 rounded-full sm:block"
        />
      ) : null}
      {showFullscreen ? (
        <Bone stagger={1} className="size-8 shrink-0 rounded-full" />
      ) : null}
      {showHistory ? (
        <Bone stagger={1} className="size-8 shrink-0 rounded-full" />
      ) : null}
      {showNewChat ? (
        <Bone stagger={1} className="size-8 shrink-0 rounded-full" />
      ) : null}
      {mobile ? (
        <Bone stagger={1} className="size-8 shrink-0 rounded-full" />
      ) : null}
    </div>
  )
}

function ChatHistoryRailSkeleton({
  sidebarWidth = "16rem",
  className,
}: {
  sidebarWidth?: string
  className?: string
}) {
  return (
    <aside
      data-slot="chat-history-rail"
      className={cn(
        "relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-r-xl bg-sidebar text-sidebar-foreground",
        className
      )}
      style={{ width: sidebarWidth }}
      aria-hidden
    >
      <div className="flex shrink-0 items-center gap-2 px-2 py-2.5">
        <Bone stagger={1} className="size-8 shrink-0 rounded-full" />
        <Bone stagger={1} className="h-8 min-w-0 flex-1 rounded-full" />
        <Bone stagger={1} className="size-8 shrink-0 rounded-full" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-2 py-2">
        <Bone stagger={2} className="h-9 w-full rounded-xl" />
        <Bone stagger={2} className="h-9 w-full rounded-xl" />
        <Bone stagger={2} className="mt-2 h-3 w-12 rounded-full" />
        {Array.from({ length: 5 }, (_, index) => (
          <Bone
            key={index}
            stagger={3}
            className="h-9 w-full rounded-xl"
          />
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2 p-2">
        <Bone stagger={3} className="size-8 shrink-0 rounded-full" />
        <Bone stagger={3} className="h-8 min-w-0 flex-1 rounded-full" />
        <Bone stagger={3} className="h-8 w-16 shrink-0 rounded-full" />
      </div>
    </aside>
  )
}

type ChatAsideSkeletonVariant = "docked" | "focused" | "mobile" | "responsive"

function ChatDesktopAsideSkeleton({
  className,
  variant,
  sidebarWidth = "16rem",
  isAuthenticated = false,
}: {
  className?: string
  variant: "docked" | "focused"
  sidebarWidth?: string
  isAuthenticated?: boolean
}) {
  const t = useTranslations("workspace")
  const focused = variant === "focused"
  const guest = !isAuthenticated
  const showHistoryRail = focused
  const showHeader = !focused || guest
  const showMainColumnHeader = showHeader && !showHistoryRail

  const mainColumn = (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        chatDesktopCanvasClass
      )}
    >
      {showMainColumnHeader ? (
        <ChatHeaderSkeleton
          guestSubtitle={guest}
          showUpgrade
          showFullscreen={!focused}
          showHistory={isAuthenticated && !focused && !showHistoryRail}
          showNewChat={!focused}
        />
      ) : null}
      <ChatPromptsSkeleton />
      <ChatComposerSkeleton
        className={focused ? "border-t-0" : undefined}
      />
    </div>
  )

  if (focused || showHistoryRail) {
    return (
      <div
        data-slot="chat-aside"
        className={cn(
          "relative flex h-full min-h-0 w-full flex-row overflow-hidden",
          chatDesktopCanvasClass,
          !focused && "rounded-e-2xl",
          className
        )}
        aria-busy="true"
        aria-label={t("loadingExur")}
      >
        {showHistoryRail ? (
          <ChatHistoryRailSkeleton sidebarWidth={sidebarWidth} />
        ) : null}
        {mainColumn}
      </div>
    )
  }

  return (
    <div
      data-slot="chat-aside"
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-r-2xl bg-sidebar text-sidebar-foreground",
        className
      )}
      aria-busy="true"
      aria-label={t("loadingExur")}
    >
      {mainColumn}
    </div>
  )
}

/**
 * CSS-driven boot skeleton: mobile/tablet shell below `lg`, focused desktop at `lg+`.
 * Avoids waiting on JS matchMedia (no wrong two-column chrome on narrow viewports).
 */
function ChatResponsiveAsideSkeleton({
  className,
  sidebarWidth = "16rem",
  isAuthenticated = false,
}: {
  className?: string
  sidebarWidth?: string
  isAuthenticated?: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden",
        className
      )}
    >
      <ChatMobileAsideSkeleton className="h-full min-h-0 flex-1 lg:hidden" />
      <ChatDesktopAsideSkeleton
        className="hidden h-full min-h-0 flex-1 lg:flex"
        variant="focused"
        sidebarWidth={sidebarWidth}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}

function ChatAsideSkeleton({
  className,
  variant = "docked",
  sidebarWidth = "16rem",
  isAuthenticated = false,
}: {
  className?: string
  variant?: ChatAsideSkeletonVariant
  sidebarWidth?: string
  isAuthenticated?: boolean
}) {
  if (variant === "responsive") {
    return (
      <ChatResponsiveAsideSkeleton
        className={className}
        sidebarWidth={sidebarWidth}
        isAuthenticated={isAuthenticated}
      />
    )
  }

  if (variant === "mobile") {
    return <ChatMobileAsideSkeleton className={className} />
  }

  return (
    <ChatDesktopAsideSkeleton
      className={className}
      variant={variant}
      sidebarWidth={sidebarWidth}
      isAuthenticated={isAuthenticated}
    />
  )
}

export { Bone, ChatAsideSkeleton }
