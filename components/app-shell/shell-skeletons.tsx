import type { ComponentProps } from "react"

import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import {
  chatEmptyHeroPromptsClass,
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

const ASK_DEPTH = [28, 40, 55, 36, 68, 48] as const
const BID_DEPTH = [64, 50, 38, 44, 30, 22] as const

function BookLevelSkeleton({
  depth,
  side,
}: {
  depth: number
  side: "bid" | "ask"
}) {
  return (
    <div className="relative grid h-5 grid-cols-2 items-center px-3">
      <div
        aria-hidden
        className={cn(
          "absolute inset-y-0 right-0",
          side === "bid" ? "bg-emerald-500/10" : "bg-red-500/10"
        )}
        style={{ width: `${depth}%` }}
      />
      <Bone className="relative h-2 w-12" />
      <Bone className="relative ml-auto h-2 w-8" />
    </div>
  )
}

function FieldSkeleton() {
  return (
    <div className="flex h-8 items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-2.5">
      <Bone className="h-2 w-10" />
      <Bone className="h-2 w-16" />
    </div>
  )
}

function MetaSkeleton({ label, value }: { label: number; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <Bone className="h-2" style={{ width: label }} />
      <Bone className="h-2" style={{ width: value }} />
    </div>
  )
}

function SizeSliderSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-0.5">
      <Bone className="h-1 flex-1 rounded-full" />
      <Bone className="h-2.5 w-8" />
    </div>
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
    <div className="relative shrink-0">
      <div aria-hidden className={chatMobileHeaderScrimClass} />
      <header className="app-mobile-safe-header relative z-[1] flex items-center justify-between gap-2 bg-transparent px-6 pb-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden
            className={cn(chatMobileHeaderButtonClass, "size-10 shrink-0")}
          />
          <div
            aria-hidden
            className={cn(
              chatMobileHeaderModelClass,
              "h-10 w-[6.25rem] shrink-0"
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
      className={cn("relative mx-auto w-full max-w-3xl shrink-0", chatMobileComposerShellClass)}
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
            className="h-3 w-[4.75rem] rounded-full opacity-80"
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
  return (
    <aside
      data-slot="chat-aside"
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground",
        className
      )}
      aria-busy="true"
      aria-label="Loading Exur"
    >
      <ChatMobileGeminiBackground visible intro />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent text-foreground chat-mobile-gemini-empty">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ChatMobileHeaderSkeleton />
          <ChatMobileEmptyHeroSkeleton />
          <ChatMobileComposerSkeleton />
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
          <div className="flex w-full flex-col items-stretch gap-2">
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
        mobile && "pt-[var(--app-safe-top,0px)]"
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

type ChatAsideSkeletonVariant = "docked" | "focused" | "mobile"

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
  const mobile = variant === "mobile"
  const focused = variant === "focused"
  const guest = !isAuthenticated
  const showHistoryRail = focused || !mobile
  const showHeader = !focused || guest
  const showMainColumnHeader = showHeader && !showHistoryRail && !mobile

  if (mobile) {
    return <ChatMobileAsideSkeleton className={className} />
  }

  const mainColumn = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      {showMainColumnHeader ? (
        <ChatHeaderSkeleton
          mobile={mobile}
          guestSubtitle={guest}
          showUpgrade={!mobile}
          showFullscreen={!focused && !mobile}
          showHistory={isAuthenticated && !focused && !mobile && !showHistoryRail}
          showNewChat={!focused && !mobile}
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
          !focused && !mobile && "rounded-r-2xl",
          className
        )}
        aria-busy="true"
        aria-label="Loading Exur"
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
      aria-label="Loading Exur"
    >
      {mainColumn}
    </div>
  )
}

function TicketAsideSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
      aria-busy="true"
      aria-label="Loading order ticket"
    >
      <div className="flex h-12 shrink-0 items-center border-b border-border/60 pr-3 pl-5">
        <div className="space-y-1.5">
          <Bone className="h-3.5 w-12" />
          <Bone className="h-2.5 w-24" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="shrink-0 border-b border-border/60">
          <div className="grid grid-cols-2 border-b border-border/50 px-3 py-1.5">
            <Bone className="h-2 w-8" />
            <Bone className="ml-auto h-2 w-7" />
          </div>
          {ASK_DEPTH.map((depth) => (
            <BookLevelSkeleton key={`ask-${depth}`} depth={depth} side="ask" />
          ))}
          <div className="flex items-center justify-between border-y border-border/50 px-3 py-1.5">
            <Bone className="h-3 w-16" />
            <Bone className="h-2 w-10" />
          </div>
          {BID_DEPTH.map((depth) => (
            <BookLevelSkeleton key={`bid-${depth}`} depth={depth} side="bid" />
          ))}
        </div>

        <div className="flex flex-col gap-3 px-3 pt-2.5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bone className="size-5 rounded-sm" />
              <Bone className="h-3 w-16" />
            </div>
            <Bone className="h-2 w-12" />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <Bone className="h-7 rounded-md" />
            <Bone className="h-7 rounded-md" />
            <Bone className="h-7 rounded-md" />
          </div>

          <div className="flex h-7 items-end gap-4 border-b border-border/60 pb-0.5">
            <Bone className="h-2 w-10" />
            <Bone className="h-2 w-8" />
            <Bone className="h-2 w-6" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex h-8 items-center justify-center rounded-md border border-border bg-muted/30">
              <Bone className="h-2.5 w-16" />
            </div>
            <div className="flex h-8 items-center justify-center rounded-md border border-border bg-muted/30">
              <Bone className="h-2.5 w-16" />
            </div>
          </div>

          <div className="space-y-1 px-0.5 py-0.5">
            <MetaSkeleton label={88} value={64} />
            <MetaSkeleton label={76} value={48} />
          </div>

          <FieldSkeleton />
          <SizeSliderSkeleton />

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-0.5">
            <div className="flex items-center gap-1.5">
              <Bone className="size-3.5 rounded-sm" />
              <Bone className="h-2 w-16" />
            </div>
            <div className="flex items-center gap-1.5">
              <Bone className="size-3.5 rounded-sm" />
              <Bone className="h-2 w-20" />
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border/50 pt-2.5">
            <MetaSkeleton label={92} value={40} />
            <MetaSkeleton label={68} value={48} />
            <MetaSkeleton label={84} value={36} />
          </div>

          <div className="flex h-8 items-center justify-center rounded-md bg-muted/40">
            <Bone className="h-2.5 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { Bone, ChatAsideSkeleton, TicketAsideSkeleton }
