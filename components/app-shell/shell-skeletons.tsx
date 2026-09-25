"use client"

import type { ComponentProps } from "react"
import { useTranslations } from "next-intl"

import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import {
  chatEmptyHeroPromptsClass,
  chatMobileComposerDockClass,
  chatMobileComposerLeadingClass,
  chatMobileComposerPillClass,
  chatMobileComposerPillCompactClass,
  chatMobileComposerShellClass,
  chatMobileComposerTrailingClass,
  chatMobileEmptyHeroContentClass,
  chatMobileEmptyHeroMarkClass,
  chatMobileEmptyHeroWrapClass,
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelClass,
  chatMobileHeaderScrimClass,
  chatMobileHeaderShellClass,
  chatSamplePromptButtonClass,
  chatSamplePromptCarouselDotsClass,
  chatSamplePromptIconClass,
  chatSamplePromptTextClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function Bone({ className, ...props }: ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("rounded-sm bg-foreground/7", className)}
      {...props}
    />
  )
}

function MobileBone({
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
        "shrink-0 border-t border-border/60 px-3 pt-2.5 pb-2",
        className
      )}
    >
      <div className="rounded-xl border border-border/70 bg-muted/40 px-3 pt-2.5 pb-1.5">
        <div className="min-h-8" />
        <div className="mt-1 flex items-center justify-between">
          <Bone className="h-5 w-14 rounded-md" />
          <Bone className="size-6 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ChatMobileHeaderSkeleton() {
  return (
    <div className={chatMobileHeaderShellClass}>
      <div aria-hidden className={chatMobileHeaderScrimClass} />
      <header className="app-mobile-safe-header relative z-1 flex items-center justify-between gap-2 bg-transparent px-6 pb-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden
            className={cn(chatMobileHeaderButtonClass, "size-10 shrink-0")}
          />
          <div
            aria-hidden
            className={cn(
              chatMobileHeaderModelClass,
              "h-10 w-25 shrink-0"
            )}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div
            aria-hidden
            className={cn(chatMobileHeaderButtonClass, "size-10 shrink-0")}
          />
          <div
            aria-hidden
            className={cn(chatMobileHeaderButtonClass, "size-10 shrink-0")}
          />
        </div>
      </header>
    </div>
  )
}

function ChatMobileStarterCardSkeleton() {
  return (
    <div className={cn(chatSamplePromptButtonClass, "pointer-events-none")}>
      <div className="flex w-full min-w-0 items-start gap-2.5 sm:gap-3">
        <MobileBone
          stagger={2}
          className={cn(chatSamplePromptIconClass, "bg-transparent shadow-none")}
        />
        <div className={chatSamplePromptTextClass}>
          <MobileBone stagger={2} className="h-3.5 w-24 rounded-full" />
          <MobileBone stagger={3} className="h-2.5 w-full rounded-full" />
          <MobileBone stagger={3} className="h-2.5 w-[88%] rounded-full" />
        </div>
      </div>
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
          <MobileBone
            stagger={1}
            className={cn(chatMobileEmptyHeroMarkClass, "bg-transparent shadow-none")}
          />
          <MobileBone
            stagger={2}
            className="h-7 w-[min(18rem,78%)] max-w-[18rem] rounded-full"
          />
          <div className={chatEmptyHeroPromptsClass}>
            <MobileBone
              stagger={2}
              className="h-2.5 w-12 self-center rounded-full opacity-80"
            />
            <ChatMobileStarterCardSkeleton />
            <div className={cn("flex items-center justify-center gap-1.5", chatSamplePromptCarouselDotsClass)}>
              <MobileBone className="size-1.5 rounded-full bg-muted-foreground/25" />
              <MobileBone className="size-1.5 rounded-full bg-muted-foreground/38" />
              <MobileBone className="size-1.5 rounded-full bg-muted-foreground/25" />
            </div>
          </div>
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
      className={cn("relative mx-auto w-full max-w-3xl", chatMobileComposerShellClass)}
    >
      <div
        className={cn(
          chatMobileComposerPillClass,
          chatMobileComposerPillCompactClass
        )}
      >
        <div className={chatMobileComposerLeadingClass}>
          <MobileBone
            stagger={3}
            className="size-10 shrink-0 rounded-full bg-foreground/[0.07]"
          />
        </div>
        <div className="[grid-area:field] flex min-h-8 min-w-0 items-center px-2.5">
          <MobileBone
            stagger={3}
            className="h-3 w-19 rounded-full opacity-80"
          />
        </div>
        <div className={chatMobileComposerTrailingClass}>
          <MobileBone
            stagger={3}
            className="size-10 shrink-0 rounded-full bg-foreground/[0.07]"
          />
        </div>
      </div>
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
      <ChatMobileGeminiBackground visible intro />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent text-foreground chat-mobile-gemini-empty">
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

function ChatDesktopStarterCardSkeleton() {
  return (
    <div className={cn(chatSamplePromptButtonClass, "pointer-events-none")}>
      <div className="flex w-full min-w-0 items-start gap-2.5 sm:gap-3">
        <Bone
          className={cn(chatSamplePromptIconClass, "bg-muted/15 shadow-none")}
        />
        <div className={chatSamplePromptTextClass}>
          <Bone className="h-3.5 w-24 rounded-full" />
          <Bone className="h-2.5 w-full rounded-full" />
          <Bone className="hidden h-2.5 w-[88%] rounded-full sm:block" />
        </div>
      </div>
    </div>
  )
}

function ChatPromptsSkeleton() {
  return (
    <div className="chat-empty-hero-shell flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        <Bone className="size-16 shrink-0 rounded-2xl" />
        <Bone className="h-7 w-[min(20rem,88%)] max-w-[20rem] rounded-full" />
        <div className={chatEmptyHeroPromptsClass}>
          <Bone className="h-2.5 w-12 self-center rounded-full" />
          <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-2">
            <ChatDesktopStarterCardSkeleton />
            <ChatDesktopStarterCardSkeleton />
            <ChatDesktopStarterCardSkeleton />
          </div>
        </div>
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
        "flex min-h-12 shrink-0 items-center gap-1 px-2 sm:gap-2 sm:px-3",
        mobile && "pt-(--app-safe-top,0px)"
      )}
    >
      {mobile ? (
        <Bone className="size-8 shrink-0 rounded-md" />
      ) : (
        <Bone className="size-7 shrink-0 rounded-full" />
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <Bone className="h-3 w-10" />
        <Bone className={cn("h-2", guestSubtitle ? "w-36" : "w-16")} />
      </div>
      {showUpgrade ? (
        <Bone className="hidden h-6 w-14 shrink-0 rounded-md sm:block" />
      ) : null}
      {showFullscreen ? (
        <Bone className="size-8 shrink-0 rounded-md" />
      ) : null}
      {showHistory ? <Bone className="size-8 shrink-0 rounded-md" /> : null}
      {showNewChat ? <Bone className="size-8 shrink-0 rounded-md" /> : null}
      {mobile ? <Bone className="size-8 shrink-0 rounded-md" /> : null}
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
      className={cn(
        "relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
        className
      )}
      style={{ width: sidebarWidth }}
      aria-hidden
    >
      <div className="flex shrink-0 items-center gap-1 px-2 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
          <Bone className="size-7 shrink-0 rounded-full" />
          <Bone className="h-3.5 w-10" />
        </div>
        <Bone className="size-8 shrink-0 rounded-md" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
        <Bone className="h-9 w-full rounded-lg" />
        <Bone className="h-9 w-full rounded-lg" />
        <Bone className="h-3 w-12 px-3 pt-2" />
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg px-3 py-2"
          >
            <Bone className="size-4 shrink-0 rounded-sm" />
            <Bone className="h-3 min-w-0 flex-1" />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2 p-2">
        <Bone className="size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Bone className="h-2.5 w-20" />
          <Bone className="h-2 w-10" />
        </div>
        <Bone className="h-8 w-16 shrink-0 rounded-full" />
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
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
        className={focused ? "mx-auto w-full max-w-3xl border-t-0" : undefined}
      />
    </div>
  )

  if (focused || showHistoryRail) {
    return (
      <div
        data-slot="chat-aside"
        className={cn(
          "relative flex h-full min-h-0 w-full flex-row overflow-hidden bg-sidebar text-sidebar-foreground",
          !focused && "rounded-r-2xl",
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
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground rounded-r-2xl",
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
