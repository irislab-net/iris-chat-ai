"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { NewspaperIcon, SparklesIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "@/i18n/navigation"
import {
  dismissIrisChatBadge,
  isIrisChatBadgeDismissed,
} from "@/lib/chat-storage"
import { cn } from "@/lib/utils"
import {
  resolveWorkspaceTab,
  WORKSPACE_TAB_NEWS,
  workspaceTabHref,
} from "@/lib/workspace-tab"

type NavChatItem = {
  kind: "chat"
  id: "chat"
  icon: typeof SparklesIcon
}

type NavTabItem = {
  kind: "tab"
  id: typeof WORKSPACE_TAB_NEWS
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

type NavItem = NavChatItem | NavTabItem

const ITEMS: NavItem[] = [
  { kind: "chat", id: "chat", icon: SparklesIcon },
  { kind: "tab", id: WORKSPACE_TAB_NEWS, icon: NewspaperIcon },
]

function scrollMainToTop() {
  const scroller = document.querySelector<HTMLElement>(
    '[data-slot="context-main"] .overflow-y-auto'
  )
  scroller?.scrollTo({ top: 0, behavior: "smooth" })
}

function subscribeIrisChatBadge(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  return () => window.removeEventListener("storage", onStoreChange)
}

function resolveActiveIndex(
  chatActive: boolean,
  onApp: boolean,
  tabParam: typeof WORKSPACE_TAB_NEWS | null
) {
  if (chatActive) return 0
  if (!onApp) return -1
  const tab = tabParam ?? WORKSPACE_TAB_NEWS
  return ITEMS.findIndex((item) => item.kind === "tab" && item.id === tab)
}

type MobileBottomNavProps = {
  chatActive?: boolean
  onOpenChat?: () => void
  onCloseChat?: () => void
  hidden?: boolean
}

function MobileBottomNav({
  chatActive = false,
  onOpenChat,
  onCloseChat,
  hidden = false,
}: MobileBottomNavProps) {
  const t = useTranslations("workspace")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const onApp = pathname === "/app"
  const tabParam = resolveWorkspaceTab(
    onApp ? searchParams.get("tab") : null
  )
  const activeIndex = resolveActiveIndex(chatActive, onApp, tabParam)
  const irisBadgeDismissed = React.useSyncExternalStore(
    subscribeIrisChatBadge,
    isIrisChatBadgeDismissed,
    () => true
  )
  const [irisBadgeHiddenLocally, setIrisBadgeHiddenLocally] =
    React.useState(false)
  const showIrisBadge = !irisBadgeDismissed && !irisBadgeHiddenLocally

  function openChat() {
    if (showIrisBadge) {
      dismissIrisChatBadge()
      setIrisBadgeHiddenLocally(true)
    }
    if (!onApp) router.push("/app")
    onOpenChat?.()
  }

  function openNews() {
    onCloseChat?.()
    const href = workspaceTabHref(WORKSPACE_TAB_NEWS)
    if (onApp) {
      router.replace(href, { scroll: false })
    } else {
      router.push(href)
    }
    scrollMainToTop()
  }

  if (hidden) return null

  return (
    <nav
      data-slot="mobile-bottom-nav"
      aria-label={t("primaryNav")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-background lg:hidden"
    >
      <div className="pointer-events-auto bg-background pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div
          data-tour="nav"
          className="relative mx-auto grid h-11 max-w-lg grid-cols-2 border-t border-border/40 bg-background/95 px-1 backdrop-blur-xl backdrop-saturate-150"
        >
          {ITEMS.map((item, index) => {
            const Icon = item.icon
            const isChat = item.kind === "chat"
            const active = index === activeIndex
            const label = isChat ? t("iris") : t("news")

            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                data-tour={
                  isChat
                    ? "nav-iris"
                    : item.kind === "tab"
                      ? "nav-news"
                      : undefined
                }
                className={cn(
                  "relative z-10 h-full min-w-0 flex-col gap-0.5 rounded-2xl border-0 bg-transparent px-1 py-1.5 text-[10px] shadow-none transition-[color,filter] duration-200 hover:bg-transparent active:bg-transparent focus-visible:bg-transparent aria-expanded:bg-transparent dark:hover:bg-transparent",
                  active
                    ? "font-semibold text-foreground drop-shadow-[0_0_18px_color-mix(in_oklch,var(--foreground)_28%,transparent)] hover:text-foreground"
                    : "font-medium text-muted-foreground/70 hover:text-foreground/80"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={isChat ? t("irisChat") : label}
                onPointerEnter={
                  isChat
                    ? () => {
                        void import("@/components/app-shell/chat-aside")
                      }
                    : undefined
                }
                onClick={() => {
                  if (isChat) openChat()
                  else openNews()
                }}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-[transform,color] duration-200",
                    active
                      ? "scale-110 stroke-[2.25] text-foreground"
                      : "stroke-[1.75] text-muted-foreground/70"
                  )}
                  aria-hidden
                />
                <span className="w-full truncate">{label}</span>
                {isChat && showIrisBadge && !chatActive ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-2 end-3 flex size-2"
                  >
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-foreground ring-2 ring-background" />
                  </span>
                ) : null}
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export { MobileBottomNav }
