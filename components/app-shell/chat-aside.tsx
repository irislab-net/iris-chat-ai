"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  HistoryIcon,
  Maximize2Icon,
  RefreshCwIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ChatAccountFooter } from "@/components/app-shell/chat-account-footer"
import { ChatAccountMenu } from "@/components/app-shell/chat-account-menu"
import { ExurLogo } from "@/components/brand/exur-logo"
import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import {
  chatDesktopCanvasClass,
  chatMobileScrollDownClass,
  chatMobileThreadBottomFadeClass,
  chatMobileThreadBottomSpacerClass,
  chatMobileThreadClass,
  chatMobileThreadFirstTurnClass,
  chatMobileThreadScrollMaskClass,
  chatMobileThreadTopSpacerClass,
  chatMobileComposerDockClass,
  chatMobileEmptyHeroContentClass,
  chatMobileEmptyHeroMarkClass,
  chatMobileEmptyHeroTitleClass,
  chatMobileEmptyHeroWrapClass,
  chatSamplePromptButtonClass,
  chatThreadConnectButtonClass,
  chatThreadUpgradeClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatMobileHeader } from "@/components/app-shell/chat-mobile-header"
import { ChatMobileSlidePanel } from "@/components/app-shell/chat-mobile-slide-panel"
import { ChatGeminiNewChatIcon } from "@/components/app-shell/chat-gemini-new-chat-icon"
import { ChatComposer } from "@/components/app-shell/chat-composer"
import { MAIN_CONTENT_ID } from "@/components/landing/modern/skip-to-content"
import { ChatMessageActions } from "@/components/app-shell/chat-message-actions"
import {
  ChatAssistantTurn,
  ChatSystemNote,
  IrisMark,
} from "@/components/app-shell/chat-message"
import { ChatNoTradeCard } from "@/components/app-shell/chat-no-trade-card"
import {
  ChatReplyChip,
  type ChatReplyTarget,
} from "@/components/app-shell/chat-reply-chip"
import { ChatSignalCard } from "@/components/app-shell/chat-signal-card"
import {
  enrichPaperTicketsOnMessages,
  splitSignalAssistantMessage,
} from "@/lib/chat/signal-setup"
import {
  ChatThreadOptionsMenu,
  ChatThreadToolbar,
  ChatThreadUpgradeButton,
} from "@/components/app-shell/chat-thread-toolbar"
import { ChatUserTurn } from "@/components/app-shell/chat-user-message"
import {
  conversationMarkdownFilename,
  copyTextToClipboard,
  downloadTextFile,
  formatConversationMarkdown,
  formatConversationTranscript,
} from "@/lib/chat/transcript"
import { ChatAsideSkeleton } from "@/components/app-shell/shell-skeletons"
import { useTicketSlot } from "@/components/app-shell/ticket-slot"
import { typewriterReveal } from "@/components/app-shell/chat-typing"
import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { GuestTrialExhaustedDialog } from "@/components/auth/guest-trial-exhausted-dialog"
import { CreditsExhaustedDialog } from "@/components/billing/credits-exhausted-dialog"
import dynamic from "next/dynamic"
import { useIsDesktop } from "@/hooks/use-media-query"
import { useNewsSpotlight } from "@/hooks/use-news-spotlight"
import { useShellSidebarLayout } from "@/hooks/use-shell-sidebar-layout"
import { useChatClientContext } from "@/hooks/use-chat-client-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { executeChatClientActions } from "@/lib/api/chat"
import { submitChatMessageFeedback } from "@/lib/api/chat-feedback"
import {
  deleteChatSession,
  fetchChatSessions,
  applySessionListToStore,
  patchChatSession,
} from "@/lib/api/chat-sessions"
import { appendThinkingStep } from "@/lib/api/chat-sse"
import { fetchCoPilotUsage, streamCoPilotChat } from "@/lib/api/co-pilot"
import {
  hasPlanUpgradePendingRefresh,
  getStoredAccessToken,
} from "@/lib/api/auth"
import {
  refreshSessionInStore,
  syncChatHistoryFromServer,
} from "@/lib/chat-history-sync"
import { displayPlanName } from "@/lib/billing/catalog"
import { LANDING_CHAT_QUERY_PARAM } from "@/lib/landing-chat-handoff"
import { isAppDeskPath, UPGRADE_PATH } from "@/lib/site"
import { resolveUserDisplayName } from "@/lib/user-profile"
import type {
  CoPilotHistoryMessage,
  ChatCreditBalance,
  NewsItem,
  TrialInfo,
} from "@/lib/api/types"
import { formatCreditUsageCompact } from "@/lib/api/credit-usage"
import {
  trackChatMessageBlockedGuest,
  trackChatMessageSent,
} from "@/lib/analytics"
import {
  ensureGuestSession,
  formatGuestTrialLabel,
  getStoredGuestUserId,
  GuestChatError,
} from "@/lib/guest-chat"
import { isValidWebSessionId, newWebSessionId } from "@/lib/web-session-id"
import {
  buildFailedAssistantTurn,
  getRetryUserMessage,
  isAbortError,
  isLowSignalUserMessage,
  prepareMessagesForRetry,
  removeEmptyAssistantTurn,
  COPILOT_CREDIT_MESSAGE,
  COPILOT_PRO_SESSION_REFRESH_MESSAGE,
  coPilotUserFacingError,
  coPilotFailureAction,
  isCreditExhaustedError,
  shouldShowGuestSignInPrompt,
  localizeCoPilotErrorText,
} from "@/lib/co-pilot-recovery"
import {
  conversationTitleFromMessages,
  deleteConversation,
  hasUserMessages,
  NEW_CHAT_TITLE,
  readChatStore,
  restoreMessages,
  sanitizeMessages,
  resolveActiveConversation,
  setActiveConversation,
  truncateHistoryBeforeMessageIndex,
  upsertConversation,
  writeChatStore,
  type ChatUiMessage,
  type StoredConversation,
} from "@/lib/chat-storage"
import {
  DEFAULT_CHAT_EFFORT,
  readChatEffort,
  writeChatEffort,
  type ChatEffort,
} from "@/lib/chat-effort"
import { SESSION_RESET_EVENT } from "@/lib/session-reset"
import type { ChatDisplayMode } from "@/lib/shell-layout-prefs"
import {
  readShellLayoutPrefs,
  writeShellLayoutPrefs,
} from "@/lib/shell-layout-prefs"
import { SHELL_SIDEBAR_COMPACT_FALLBACK } from "@/lib/shell-sidebar-layout"
import { stripUnrequestedIrisSetupFromReply } from "@/lib/chat/strip-signal-setup"
import { summarizeSignalUserMessage } from "@/lib/chat/composer-mentions"
import {
  replyTargetFromMessage,
  stampUiMessageFromRef,
} from "@/lib/chat/message-stamp"
import { stripMarketContextAppendix } from "@/lib/chat/strip-market-context"
import {
  isMobileGeminiBackgroundActive,
  isMobileGeminiBackgroundVisible,
  resolveMobileGeminiVisualPhase,
} from "@/lib/chat/mobile-gemini-visual-state"
import {
  readHistoryRailCollapsed,
  writeHistoryRailCollapsed,
} from "@/lib/chat-history-rail-prefs"
import { cn } from "@/lib/utils"
import { localeDirection } from "@/lib/i18n/locale"
import { useChatThreadTransition } from "@/hooks/use-chat-thread-transition"

const ChatNewsSidePanel = dynamic(
  () =>
    import("@/components/app-shell/chat-news-panel").then(
      (m) => m.ChatNewsSidePanel
    ),
  { ssr: false }
)
const ChatNewsMobileSheet = dynamic(
  () =>
    import("@/components/app-shell/chat-news-panel").then(
      (m) => m.ChatNewsMobileSheet
    ),
  { ssr: false }
)
const ChatHistoryRail = dynamic(
  () =>
    import("@/components/app-shell/chat-history-sidebar").then(
      (m) => m.ChatHistoryRail
    ),
  { ssr: false }
)
const ChatHistorySidebar = dynamic(
  () =>
    import("@/components/app-shell/chat-history-sidebar").then(
      (m) => m.ChatHistorySidebar
    ),
  { ssr: false }
)
const AIMessageRenderer = dynamic(
  () =>
    import("@/components/app-shell/ai-message-renderer").then(
      (m) => m.AIMessageRenderer
    ),
  { ssr: false }
)

const IrisSamplePrompts = dynamic(
  () =>
    import("@/components/app-shell/chat-sample-prompts").then(
      (m) => m.IrisSamplePrompts
    ),
  { ssr: false }
)

type ChatAsideProps = {
  className?: string
  /** Shown on mobile full-screen chat overlay */
  onClose?: () => void
  displayMode?: ChatDisplayMode
  onDisplayModeChange?: (mode: ChatDisplayMode) => void
  /** When chat is the sole primary view, expose #main-content for skip links. */
  isPrimaryContent?: boolean
}

const CHAT_CONTENT_MAX_WIDTH = "max-w-3xl"
const CHAT_SCROLL_BOTTOM_THRESHOLD = 72

const headerIconClass =
  "size-8 text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground [&_svg:not([class*='size-'])]:size-4"

function ChatHeaderIconButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  pressed?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={headerIconClass}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}

function blankConversation(id: string): {
  id: string
  messages: ChatUiMessage[]
  history: CoPilotHistoryMessage[]
} {
  return {
    id,
    messages: [],
    history: [],
  }
}

/** Empty-thread ids may be reused only when they already match the web format. */
function reusableBlankSessionId(activeId: string | null | undefined): string {
  if (!activeId || !/^[0-9a-f]{40}$/.test(activeId)) return ""
  return activeId
}

function IrisFollowUpPrompts({
  prompts,
  disabled,
  onSelect,
}: {
  prompts: string[]
  disabled?: boolean
  onSelect: (text: string) => void
}) {
  const t = useTranslations("workspace")
  if (prompts.length === 0) return null
  return (
    <div className="flex w-full flex-col gap-2.5">
      <p className="px-0.5 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {t("continueWith")}
      </p>
      <div className="flex w-full flex-col gap-2">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="ghost"
            disabled={disabled}
            dir="auto"
            className={cn(
              chatSamplePromptButtonClass,
              "h-auto gap-3 px-4 py-2.5 text-[14px] leading-[1.3] font-medium tracking-[-0.01em] whitespace-normal text-foreground disabled:opacity-50 sm:px-4 sm:py-2.5"
            )}
            onClick={() => onSelect(prompt)}
          >
            <span className="min-w-0 flex-1 text-start text-pretty">
              {prompt}
            </span>
            <ArrowUpRightIcon
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/65 transition-[color,transform] group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5 group-hover/button:text-foreground"
            />
          </Button>
        ))}
      </div>
    </div>
  )
}

function ChatAside({
  className,
  onClose,
  displayMode = "docked",
  onDisplayModeChange,
  isPrimaryContent = false,
}: ChatAsideProps) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const textDir = localeDirection(useLocale())
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isDesktop = useIsDesktop()
  const shellSidebars =
    useShellSidebarLayout() ?? SHELL_SIDEBAR_COMPACT_FALLBACK
  const ticketSlot = useTicketSlot()
  const [deskWaitTimedOut, setDeskWaitTimedOut] = React.useState(false)
  const waitForDesk = isAppDeskPath(pathname) && isDesktop === true
  React.useEffect(() => {
    if (!waitForDesk) return
    const id = window.setTimeout(() => setDeskWaitTimedOut(true), 4000)
    return () => window.clearTimeout(id)
  }, [waitForDesk])
  const {
    isAuthenticated,
    isProUser,
    loading: authLoading,
    login,
    loginPending,
    refresh,
    refreshAfterUpgrade,
    user,
  } = useAuth()

  const coPilotSessionRefresh = React.useMemo(
    () => ({
      refreshSession: refresh,
      refreshAfterUpgrade,
    }),
    [refresh, refreshAfterUpgrade]
  )

  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return
    if (!hasPlanUpgradePendingRefresh()) return
    void refreshAfterUpgrade()
  }, [authLoading, isAuthenticated, refreshAfterUpgrade])
  const showDeskSkeleton =
    waitForDesk &&
    displayMode === "docked" &&
    !authLoading &&
    !ticketSlot?.occupied &&
    !deskWaitTimedOut
  const chatClientContext = useChatClientContext({ user, isProUser })
  /** Stable backend user id when signed in; null for guest (isolated bucket). */
  const chatOwnerId = isAuthenticated && user?.id ? user.id : null
  const [hydrated, setHydrated] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatUiMessage[]>([])
  const [history, setHistory] = React.useState<CoPilotHistoryMessage[]>([])
  const [conversationId, setConversationId] = React.useState("")
  const conversationIdRef = React.useRef(conversationId)
  conversationIdRef.current = conversationId
  const [conversations, setConversations] = React.useState<
    StoredConversation[]
  >([])
  const [deletingIds, setDeletingIds] = React.useState<ReadonlySet<string>>(
    () => new Set()
  )
  const deletingIdsRef = React.useRef<Set<string>>(new Set())
  const [sending, setSending] = React.useState(false)
  const sendingRef = React.useRef(false)
  sendingRef.current = sending
  const [newsOpen, setNewsOpenState] = React.useState(() =>
    typeof window !== "undefined" ? readShellLayoutPrefs().newsOpen : false
  )

  const setNewsOpen = React.useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setNewsOpenState((prev) => {
        const value = typeof next === "function" ? next(prev) : next
        writeShellLayoutPrefs({ newsOpen: value })
        return value
      })
    },
    []
  )
  const [historyRailCollapsed, setHistoryRailCollapsed] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(
    () => displayMode === "focused"
  )
  const [pendingAssistantId, setPendingAssistantId] = React.useState<
    string | null
  >(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const scrollViewportRef = React.useRef<HTMLDivElement>(null)
  const stickToBottomRef = React.useRef(true)
  const scrollFollowRafRef = React.useRef<number | null>(null)
  const [showScrollDown, setShowScrollDown] = React.useState(false)
  const composerRef = React.useRef<HTMLTextAreaElement>(null)
  const focusComposer = React.useCallback(() => {
    queueMicrotask(() => {
      const el = composerRef.current
      if (!el) return
      try {
        el.focus({ preventScroll: true })
      } catch {
        el.focus()
      }
    })
  }, [])
  const [draft, setDraft] = React.useState("")
  const [replyTarget, setReplyTarget] = React.useState<ChatReplyTarget | null>(
    null
  )
  const [effort, setEffort] = React.useState<ChatEffort>(DEFAULT_CHAT_EFFORT)
  React.useEffect(() => {
    setEffort(readChatEffort())
  }, [])
  const abortRef = React.useRef<AbortController | null>(null)
  const persistTimer = React.useRef(0)
  const historySyncRef = React.useRef(0)
  const [session, setSession] = React.useState<string>("pending")
  const [guestTrial, setGuestTrial] = React.useState<TrialInfo | null>(null)
  const [creditBalance, setCreditBalance] =
    React.useState<ChatCreditBalance | null>(null)
  const [creditsExhaustedOpen, setCreditsExhaustedOpen] = React.useState(false)
  const [guestTrialExhaustedOpen, setGuestTrialExhaustedOpen] =
    React.useState(false)
  const [guestUnavailable, setGuestUnavailable] = React.useState(false)
  const [guestSendError, setGuestSendError] = React.useState<string | null>(
    null
  )
  const [guestOwnerId, setGuestOwnerId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (authLoading || isAuthenticated) {
      setGuestTrial(null)
      setGuestUnavailable(false)
      setGuestTrialExhaustedOpen(false)
      if (isAuthenticated) setGuestOwnerId(null)
      return
    }

    let cancelled = false
    void ensureGuestSession()
      .then((session) => {
        if (!cancelled) {
          setGuestTrial(session.trial)
          setGuestOwnerId(session.user_id)
          setGuestUnavailable(false)
          setGuestSendError(null)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof GuestChatError) {
          if (error.trial) setGuestTrial(error.trial)
          if (error.code === "guest_unavailable") {
            setGuestUnavailable(true)
            setGuestSendError(t("guestSendBlocked"))
            return
          }
          if (error.code === "upstream_unreachable") {
            setGuestUnavailable(false)
            setGuestSendError(t("guestChatUpstreamUnreachable"))
            return
          }
        }
        setGuestUnavailable(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, t])

  React.useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      if (authLoading || !isAuthenticated) {
        setCreditBalance(null)
        return
      }
      void fetchCoPilotUsage()
        .then((mapped) => {
          if (!cancelled) setCreditBalance(mapped.credit_balance ?? null)
        })
        .catch(() => {
          if (!cancelled) setCreditBalance(null)
        })
    })
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  const guestTrialExhausted =
    !isAuthenticated && (guestTrial?.messages_remaining ?? 1) <= 0

  const applyStoredConversation = React.useCallback(
    (conversation: StoredConversation) => {
      setConversationId(conversation.id)
      setMessages(
        enrichPaperTicketsOnMessages(
          restoreMessages(conversation.messages, conversation.history)
        )
      )
      setHistory(conversation.history)
    },
    []
  )

  const refreshConversationFromServer = React.useCallback(
    async (sessionId: string) => {
      if (!chatOwnerId || sendingRef.current) return
      try {
        const store = await refreshSessionInStore(chatOwnerId, sessionId)
        // A newer send may have started while history was fetching.
        if (sendingRef.current) return
        setConversations(store.conversations)
        const updated = store.conversations.find((c) => c.id === sessionId)
        if (!updated) return
        setConversationId((currentId) => {
          if (currentId !== sessionId) return currentId
          setMessages(
            enrichPaperTicketsOnMessages(
              restoreMessages(updated.messages, updated.history)
            )
          )
          setHistory(updated.history)
          return currentId
        })
      } catch {
        // Keep local copy when the server is unavailable.
      }
    },
    [chatOwnerId]
  )

  const persistCurrent = React.useEffectEvent(
    (next: {
      id: string
      messages: ChatUiMessage[]
      history: CoPilotHistoryMessage[]
      previousId?: string
      ownerId: string | null
    }) => {
      if (!hydrated) return
      window.clearTimeout(persistTimer.current)

      const cleaned = sanitizeMessages(next.messages)
      if (!hasUserMessages(cleaned)) {
        const store = readChatStore(next.ownerId)
        writeChatStore(next.ownerId, setActiveConversation(store, next.id))
        return
      }

      const now = new Date().toISOString()
      const storeBefore = readChatStore(next.ownerId)
      const existing =
        storeBefore.conversations.find((c) => c.id === next.id) ??
        (next.previousId
          ? storeBefore.conversations.find((c) => c.id === next.previousId)
          : undefined)

      let store = storeBefore
      if (next.previousId && next.previousId !== next.id) {
        store = deleteConversation(store, next.previousId)
      }

      const saved: StoredConversation = {
        id: next.id,
        title: conversationTitleFromMessages(cleaned),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        messages: cleaned,
        history: next.history,
        pinned: existing?.pinned,
      }

      store = upsertConversation(store, saved, { setActive: true })
      writeChatStore(next.ownerId, store)
      setConversations(store.conversations)
    }
  )

  // Hydrate once auth resolves (adjust state during render — avoids effect cascades).
  // Include user id in the session key so A→B account switches re-read the correct bucket.
  if (!authLoading) {
    const nextSession = isAuthenticated
      ? (`user:${user?.id ?? ""}` as const)
      : ("guest" as const)
    if (session !== nextSession) {
      setSession(nextSession)
      const store = readChatStore(chatOwnerId)
      setConversations(store.conversations)
      const restored = resolveActiveConversation(store)
      if (restored) {
        applyStoredConversation(restored)
        if (store.activeId !== restored.id) {
          writeChatStore(chatOwnerId, setActiveConversation(store, restored.id))
        }
      } else {
        // Keep a blank id across refresh only when it already matches the web format.
        // Prefix check is async, so a 40-char candidate is confirmed in an effect.
        const storedBlankId =
          store.activeId &&
          !store.conversations.some((c) => c.id === store.activeId)
            ? store.activeId
            : ""
        const blank = blankConversation(reusableBlankSessionId(storedBlankId))
        setConversationId(blank.id)
        setMessages(blank.messages)
        setHistory(blank.history)
      }
      setHistoryOpen(false)
      setHydrated(true)
    }
  }

  React.useEffect(() => {
    if (!hydrated || !chatOwnerId || authLoading) return

    const syncId = historySyncRef.current + 1
    historySyncRef.current = syncId
    let cancelled = false

    void (async () => {
      try {
        let store = await syncChatHistoryFromServer(chatOwnerId)
        if (cancelled || syncId !== historySyncRef.current) return
        try {
          const sessions = await fetchChatSessions({ limit: 100 })
          if (cancelled || syncId !== historySyncRef.current) return
          store = applySessionListToStore(store, sessions.items)
          writeChatStore(chatOwnerId, store)
        } catch {
          // Sessions list is JWT-only enrichment; history sync still applies.
        }
        if (cancelled || syncId !== historySyncRef.current) return
        setConversations(store.conversations)

        const restored = resolveActiveConversation(store)
        if (restored) {
          void refreshConversationFromServer(restored.id)
        }
      } catch {
        // Offline or unauthenticated copilot — local history still works.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    authLoading,
    chatOwnerId,
    hydrated,
    refreshConversationFromServer,
    session,
  ])

  const scrollToChatBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (scrollFollowRafRef.current != null) {
        window.cancelAnimationFrame(scrollFollowRafRef.current)
        scrollFollowRafRef.current = null
      }
      const viewport = scrollViewportRef.current
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior })
      }
      stickToBottomRef.current = true
      setShowScrollDown(false)
    },
    []
  )

  /** Soft exponential follow while typewriter grows — no per-chunk snap. */
  const followChatBottom = React.useCallback(() => {
    if (!stickToBottomRef.current) return
    if (scrollFollowRafRef.current != null) return

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const step = () => {
      scrollFollowRafRef.current = null
      if (!stickToBottomRef.current) return
      const viewport = scrollViewportRef.current
      if (!viewport) return

      const target = viewport.scrollHeight - viewport.clientHeight
      const current = viewport.scrollTop
      const gap = target - current

      if (gap <= 0.5) {
        if (gap > 0) viewport.scrollTop = target
        return
      }

      // Large jumps (new turn) snap; typing growth tracks tightly.
      if (reducedMotion || gap > 180) {
        viewport.scrollTop = target
        return
      }

      viewport.scrollTop = current + Math.max(1.5, gap * 0.55)
      scrollFollowRafRef.current = window.requestAnimationFrame(step)
    }

    scrollFollowRafRef.current = window.requestAnimationFrame(step)
  }, [])

  React.useEffect(() => {
    followChatBottom()
  }, [messages, historyOpen, pendingAssistantId, followChatBottom])

  React.useEffect(() => {
    return () => {
      if (scrollFollowRafRef.current != null) {
        window.cancelAnimationFrame(scrollFollowRafRef.current)
        scrollFollowRafRef.current = null
      }
    }
  }, [])

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  React.useEffect(() => {
    if (!hydrated || authLoading) return
    if (hasUserMessages(messages)) return
    const ownerId = chatOwnerId ?? guestOwnerId
    if (!ownerId) return
    const storageOwnerId = chatOwnerId
    let cancelled = false
    const seen = conversationIdRef.current
    void (async () => {
      if (seen && (await isValidWebSessionId(ownerId, seen))) return
      const next = await newWebSessionId(ownerId)
      if (cancelled || conversationIdRef.current !== seen) return
      conversationIdRef.current = next
      setConversationId(next)
      writeChatStore(
        storageOwnerId,
        setActiveConversation(readChatStore(storageOwnerId), next)
      )
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, chatOwnerId, guestOwnerId, hydrated, messages, session])

  React.useEffect(() => {
    function onSessionReset() {
      window.clearTimeout(persistTimer.current)
      abortRef.current?.abort()
      abortRef.current = null
      setSending(false)
      setPendingAssistantId(null)
      setHistoryOpen(false)
      setDraft("")
      setReplyTarget(null)
      setConversations([])
      setMessages([])
      setHistory([])
      // Logout drops the signed-in owner. Keep a placeholder until the guest
      // user id is known, then the mint effect binds a new session id.
      conversationIdRef.current = ""
      setConversationId("")
      setSession("guest")
      setHydrated(true)
    }

    window.addEventListener(SESSION_RESET_EVENT, onSessionReset)
    return () => window.removeEventListener(SESSION_RESET_EVENT, onSessionReset)
  }, [])

  /** State updaters may run during render in React 19; useEffectEvent cannot. */
  function setMessagesAndPersist(
    update: (prev: ChatUiMessage[]) => ChatUiMessage[],
    persist: {
      id: string
      history: CoPilotHistoryMessage[]
      previousId?: string
      ownerId: string | null
    }
  ) {
    setMessages((prev) => {
      const next = enrichPaperTicketsOnMessages(update(prev))
      queueMicrotask(() => persistCurrent({ ...persist, messages: next }))
      return next
    })
  }

  function closeHistoryPanelIfNeeded() {
    if (displayMode === "focused" && !onClose) return
    setHistoryOpen(false)
  }

  async function startNewChat() {
    abortRef.current?.abort()
    abortRef.current = null
    setSending(false)
    setPendingAssistantId(null)
    closeHistoryPanelIfNeeded()

    if (hasUserMessages(messages)) {
      persistCurrent({
        id: conversationId,
        messages,
        history,
        ownerId: chatOwnerId,
      })
    }

    const ownerId = chatOwnerId ?? getStoredGuestUserId()
    const id = ownerId ? await newWebSessionId(ownerId) : ""
    const blank = blankConversation(id)
    conversationIdRef.current = blank.id
    setConversationId(blank.id)
    setMessages(blank.messages)
    setHistory(blank.history)
    setDraft("")
    setReplyTarget(null)
    setEffort(DEFAULT_CHAT_EFFORT)
    writeChatEffort(DEFAULT_CHAT_EFFORT)
    if (!blank.id) return
    const store = setActiveConversation(readChatStore(chatOwnerId), blank.id)
    writeChatStore(chatOwnerId, store)
  }

  function openConversation(id: string) {
    if (sending) return
    if (deletingIdsRef.current.has(id)) return
    abortRef.current?.abort()
    abortRef.current = null
    setPendingAssistantId(null)

    if (hasUserMessages(messages) && id !== conversationId) {
      persistCurrent({
        id: conversationId,
        messages,
        history,
        ownerId: chatOwnerId,
      })
    }

    // Prefer localStorage — React state may lag a fresh server sync.
    // Signal cards hydrate from history `client_actions` + local overlay.
    const store = readChatStore(chatOwnerId)
    const target =
      store.conversations.find((chat) => chat.id === id) ??
      conversations.find((chat) => chat.id === id)
    if (!target) return

    applyStoredConversation(target)
    setConversations(store.conversations)
    setDraft("")
    setReplyTarget(null)
    closeHistoryPanelIfNeeded()
    writeChatStore(
      chatOwnerId,
      setActiveConversation(readChatStore(chatOwnerId), target.id)
    )
    void refreshConversationFromServer(target.id)
  }

  async function startBlankConversation() {
    const ownerId = chatOwnerId ?? getStoredGuestUserId()
    const id = ownerId ? await newWebSessionId(ownerId) : ""
    const blank = blankConversation(id)
    conversationIdRef.current = blank.id
    setConversationId(blank.id)
    setMessages(blank.messages)
    setHistory(blank.history)
    setReplyTarget(null)
    if (!blank.id) return readChatStore(chatOwnerId)
    const next = setActiveConversation(readChatStore(chatOwnerId), blank.id)
    writeChatStore(chatOwnerId, next)
    setConversations(next.conversations)
    return next
  }

  function markConversationDeleting(id: string) {
    deletingIdsRef.current.add(id)
    setDeletingIds(new Set(deletingIdsRef.current))
  }

  function clearConversationDeleting(id: string) {
    deletingIdsRef.current.delete(id)
    setDeletingIds(new Set(deletingIdsRef.current))
  }

  function removeConversation(id: string, event?: React.MouseEvent) {
    event?.stopPropagation()
    if (deletingIdsRef.current.has(id)) return

    const wasActive = id === conversationId

    // Guest / local-only: no backend confirm — remove immediately.
    if (!chatOwnerId) {
      const store = deleteConversation(readChatStore(chatOwnerId), id)
      writeChatStore(chatOwnerId, store)
      setConversations(store.conversations)
      if (wasActive) void startBlankConversation()
      return
    }

    markConversationDeleting(id)
    if (wasActive) {
      void startBlankConversation()
    }

    void deleteChatSession(id)
      .then(() => {
        const store = deleteConversation(readChatStore(chatOwnerId), id)
        writeChatStore(chatOwnerId, store)
        setConversations(store.conversations)
      })
      .catch(() => {
        // Keep the row; skeleton clears below.
      })
      .finally(() => {
        clearConversationDeleting(id)
      })
  }

  function renameConversation(id: string, title: string) {
    if (deletingIdsRef.current.has(id)) return
    const trimmed = title.trim()
    if (!trimmed) return
    const store = readChatStore(chatOwnerId)
    const target = store.conversations.find((chat) => chat.id === id)
    if (!target) return
    const updated: StoredConversation = {
      ...target,
      title: trimmed,
      updatedAt: new Date().toISOString(),
    }
    const nextStore = upsertConversation(store, updated)
    writeChatStore(chatOwnerId, nextStore)
    setConversations(nextStore.conversations)
    if (chatOwnerId) {
      void patchChatSession(id, { title: trimmed }).catch(() => {})
    }
  }

  function toggleConversationPin(id: string) {
    if (deletingIdsRef.current.has(id)) return
    const store = readChatStore(chatOwnerId)
    const target = store.conversations.find((chat) => chat.id === id)
    if (!target) return
    const updated: StoredConversation = {
      ...target,
      pinned: !target.pinned,
    }
    const nextStore = upsertConversation(store, updated)
    writeChatStore(chatOwnerId, nextStore)
    setConversations(nextStore.conversations)
    if (chatOwnerId) {
      void patchChatSession(id, { pinned: updated.pinned }).catch(() => {})
    }
  }

  function onEffortChange(next: ChatEffort) {
    setEffort(next)
    writeChatEffort(next)
  }

  function setMessageFeedback(
    messageId: string,
    feedback: ChatUiMessage["feedback"]
  ) {
    setMessagesAndPersist(
      (prev) =>
        prev.map((message) => {
          if (message.id !== messageId) return message
          if (!feedback) {
            const { feedback: _removed, ...rest } = message
            return rest
          }
          return { ...message, feedback }
        }),
      { id: conversationId, history, ownerId: chatOwnerId }
    )

    if (!chatOwnerId) return
    void submitChatMessageFeedback({
      sessionId: conversationId,
      messageId,
      vote: feedback ?? null,
    })
  }

  async function runAssistantRequest(input: {
    userMessage: string
    historySnapshot: CoPilotHistoryMessage[]
    assistantId: string
    activeId: string
    optimisticUserId: string
    replyToId?: number
  }) {
    const {
      userMessage,
      historySnapshot,
      assistantId,
      activeId,
      optimisticUserId,
      replyToId,
    } = input
    const displayUserMessage = summarizeSignalUserMessage(
      userMessage,
      t("composerToolSignalLabel")
    )

    setSending(true)
    setPendingAssistantId(assistantId)
    window.clearTimeout(persistTimer.current)

    const controller = new AbortController()
    abortRef.current = controller
    let partialContent = ""

    try {
      const result = await streamCoPilotChat(
        {
          message: userMessage,
          conversationId: activeId,
          history: historySnapshot,
          effort,
          clientContext: chatClientContext,
          replyToId,
        },
        {
          signal: controller.signal,
          onMeta: (meta) => {
            if (meta.conversation_id && meta.conversation_id !== activeId) {
              setConversationId(meta.conversation_id)
            }
          },
          onReasoning: (text) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      thinkingTrace: appendThinkingStep(m.thinkingTrace, {
                        type: "reasoning",
                        text,
                      }),
                    }
                  : m
              )
            )
          },
          onTool: (tool) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      thinkingTrace: appendThinkingStep(m.thinkingTrace, {
                        type: "tool",
                        name: tool,
                      }),
                    }
                  : m
              )
            )
          },
        },
        coPilotSessionRefresh
      )

      if (controller.signal.aborted) {
        setMessages((prev) => removeEmptyAssistantTurn(prev, assistantId))
        return
      }

      const finalId = result.conversationId || activeId
      if (finalId !== activeId) setConversationId(finalId)

      if (result.trial) {
        setGuestTrial(result.trial)
      }
      if (result.creditBalance) {
        setCreditBalance(result.creditBalance)
      }

      // Prefer client_actions (e.g. show_trade_signal) over inventing a local ticket.
      const clientResult = executeChatClientActions(result.clientActions)

      let fullText = (result.message || "").trim()
      if (fullText) {
        fullText = stripUnrequestedIrisSetupFromReply(fullText)
        fullText = stripMarketContextAppendix(fullText)
      }

      if (
        !fullText &&
        !clientResult.paperTicket &&
        !clientResult.noTradeReason
      ) {
        throw new Error("Exur returned an empty reply. Please try again.")
      }

      const turnText = fullText
      const signalTicket = clientResult.paperTicket
      // History needs prose when output_text is empty but a signal card arrived.
      const historyAssistantText =
        turnText ||
        signalTicket?.thesis?.trim() ||
        (signalTicket ? `${signalTicket.side} ${signalTicket.symbol}` : "") ||
        clientResult.noTradeReason ||
        ""

      const finalHistory: CoPilotHistoryMessage[] = [
        ...historySnapshot,
        { role: "user", content: displayUserMessage },
        { role: "assistant", content: historyAssistantText },
      ]
      setHistory(finalHistory)

      const finalizeSuccess = (
        text: string,
        suggestedPrompts?: string[],
        extras?: Pick<
          ChatUiMessage,
          "clientActionSummaries" | "paperTicket" | "action" | "noTradeReason"
        >
      ) => {
        const ticket = extras?.paperTicket
        const content =
          text.trim() ||
          ticket?.thesis?.trim() ||
          (ticket ? `${ticket.side} ${ticket.symbol}` : "")
        setPendingAssistantId(null)
        setReplyTarget(null)
        setMessagesAndPersist(
          (prev) =>
            prev.map((m) => {
              if (m.id === optimisticUserId) {
                return stampUiMessageFromRef(m, result.userMessage)
              }
              if (m.id !== assistantId) return m
              const updated: ChatUiMessage = {
                ...m,
                content,
                error: false,
                action: extras?.action,
                paperTicket:
                  extras && "paperTicket" in extras
                    ? extras.paperTicket
                    : undefined,
                clientActionSummaries: extras?.clientActionSummaries,
                noTradeReason: extras?.noTradeReason,
                retryUserMessage: undefined,
                suggestedPrompts,
                ...(result.reasoning
                  ? { reasoning: result.reasoning }
                  : m.reasoning
                    ? { reasoning: m.reasoning }
                    : {}),
              }
              return stampUiMessageFromRef(updated, result.assistantMessage)
            }),
          {
            id: finalId,
            previousId: activeId !== finalId ? activeId : undefined,
            history: finalHistory,
            ownerId: chatOwnerId,
          }
        )
        void refreshConversationFromServer(finalId)
      }

      const buildTurnExtras = (
        actions: ReturnType<typeof executeChatClientActions>,
        _assistantText: string,
        ticketOverride?: ChatUiMessage["paperTicket"]
      ): Pick<
        ChatUiMessage,
        "clientActionSummaries" | "paperTicket" | "action" | "noTradeReason"
      > => {
        // Only attach a ticket the API returned via client_actions —
        // never invent a Signal card from model prose.
        const trustedTicket = ticketOverride ?? actions.paperTicket ?? null

        if (trustedTicket) {
          return {
            clientActionSummaries: actions.summaries,
            paperTicket: trustedTicket,
            ...(actions.noTradeReason
              ? { noTradeReason: actions.noTradeReason }
              : {}),
          }
        }

        return {
          clientActionSummaries: actions.summaries,
          ...(actions.noTradeReason
            ? { noTradeReason: actions.noTradeReason }
            : {}),
        }
      }

      const turnExtras = buildTurnExtras(
        clientResult,
        turnText || historyAssistantText
      )
      // UI content = API output_text; thesis lives on paperTicket for the card.
      // Always keep a non-empty string when a signal card is present so persist
      // / abort cleanup cannot drop the turn.
      const displayText =
        turnText ||
        (turnExtras.paperTicket
          ? historyAssistantText ||
            `${turnExtras.paperTicket.side} ${turnExtras.paperTicket.symbol}`
          : "")

      const completeCoPilotTurn = () => {
        finalizeSuccess(displayText, result.suggestedPrompts, turnExtras)
      }

      // Skip typewriter when stream already painted content via onDelta,
      // when there is no prose (signal / no-trade card only), or when a signal
      // card will replace the typed block (avoids flash-then-hide of setup text).
      if (
        partialContent.trim() ||
        !displayText ||
        Boolean(turnExtras.paperTicket) ||
        Boolean(turnExtras.noTradeReason)
      ) {
        completeCoPilotTurn()
      } else {
        await typewriterReveal(
          displayText,
          (partial) => {
            partialContent = partial
            setMessages((prev) => {
              const current = prev.find((m) => m.id === assistantId)
              if (
                current &&
                current.content === partial &&
                !current.error &&
                current.action === undefined &&
                current.errorText === undefined
              ) {
                return prev
              }
              return prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: partial,
                      error: false,
                      action: undefined,
                      errorText: undefined,
                    }
                  : m
              )
            })
          },
          controller.signal
        )

        if (controller.signal.aborted) {
          setMessages((prev) => removeEmptyAssistantTurn(prev, assistantId))
          return
        }

        completeCoPilotTurn()
      }
    } catch (error) {
      if (isAbortError(error)) {
        setMessages((prev) => removeEmptyAssistantTurn(prev, assistantId))
        return
      }

      setPendingAssistantId(null)
      if (!isAuthenticated) {
        const trial = await trialFromChatError(error)
        if (shouldShowGuestSignInPrompt(error, trial ?? guestTrial)) {
          promptGuestTrialExhausted({
            trial: trial ?? guestTrial,
            assistantId,
            activeId,
            historySnapshot,
            partialContent,
          })
          return
        }
      } else if (isCreditExhaustedError(error)) {
        // HTTP 402 / credit codes only — not SSE agent/store failures (status 500).
        // Applies to Free and Plus (daily/weekly caps). Paywall is modal/sheet only.
        setCreditsExhaustedOpen(true)
        void fetchCoPilotUsage()
          .then((mapped) => {
            setCreditBalance(mapped.credit_balance ?? null)
          })
          .catch(() => undefined)
        const partial = partialContent.trim()
        setMessagesAndPersist(
          (prev) =>
            partial
              ? prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: partial,
                        error: false,
                        errorText: undefined,
                        action: undefined,
                        retryUserMessage: undefined,
                        thinkingTrace: undefined,
                      }
                    : m
                )
              : removeEmptyAssistantTurn(prev, assistantId),
          {
            id: activeId,
            history: historySnapshot,
            ownerId: chatOwnerId,
          }
        )
        return
      }

      const failed = buildFailedAssistantTurn({
        assistantId,
        partialContent,
        userMessage,
        error,
      })

      setMessagesAndPersist(
        (prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: failed.content || m.content,
                  error: true as const,
                  errorText: coPilotUserFacingError(error, { isProUser }),
                  action: coPilotFailureAction(error, { isProUser }),
                  retryUserMessage: failed.retryUserMessage,
                  thinkingTrace: undefined,
                }
              : m
          ),
        {
          id: activeId,
          history: historySnapshot,
          ownerId: chatOwnerId,
        }
      )
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setPendingAssistantId(null)
      setSending(false)
    }
  }

  function handleEditUserMessage(messageId: string) {
    if (sending) return

    const index = messages.findIndex((message) => message.id === messageId)
    if (index < 0) return
    const target = messages[index]
    if (target.role !== "user" || !target.content.trim()) return

    abortRef.current?.abort()
    abortRef.current = null
    setSending(false)
    setPendingAssistantId(null)

    const truncatedMessages = messages.slice(0, index)
    const truncatedHistory = truncateHistoryBeforeMessageIndex(
      messages,
      index,
      history
    )

    setHistory(truncatedHistory)
    setMessagesAndPersist(() => truncatedMessages, {
      id: conversationId,
      history: truncatedHistory,
      ownerId: chatOwnerId,
    })
    setDraft(target.content)

    if (isDesktop === true) {
      queueMicrotask(() => {
        const el = composerRef.current
        if (!el) return
        try {
          el.focus({ preventScroll: true })
        } catch {
          el.focus()
        }
        const end = target.content.length
        el.setSelectionRange(end, end)
      })
    }
  }

  function promptGuestTrialExhausted(options?: {
    trial?: TrialInfo | null
    /** When mid-stream: clear the empty/failed assistant bubble (keep user turn). */
    assistantId?: string
    activeId?: string
    historySnapshot?: CoPilotHistoryMessage[]
    partialContent?: string
  }) {
    if (options?.trial) setGuestTrial(options.trial)
    setGuestTrialExhaustedOpen(true)

    const assistantId = options?.assistantId
    if (!assistantId || !options.activeId) return

    const partial = options.partialContent?.trim() ?? ""
    const historySnapshot = options.historySnapshot ?? history
    setMessagesAndPersist(
      (prev) =>
        partial
          ? prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: partial,
                    error: false,
                    errorText: undefined,
                    action: undefined,
                    retryUserMessage: undefined,
                    thinkingTrace: undefined,
                    reasoning: undefined,
                  }
                : m
            )
          : removeEmptyAssistantTurn(prev, assistantId),
      {
        id: options.activeId,
        history: historySnapshot,
        ownerId: chatOwnerId,
      }
    )
  }

  /** Stream login_required has no trial object — refresh from GET /credits. */
  async function trialFromChatError(
    error: unknown
  ): Promise<TrialInfo | undefined> {
    const attached = (error as { trial?: TrialInfo } | null)?.trial
    if (attached) {
      setGuestTrial(attached)
      return attached
    }
    try {
      const usage = await fetchCoPilotUsage()
      if (usage.trial) setGuestTrial(usage.trial)
      return usage.trial
    } catch {
      return undefined
    }
  }

  async function ensureSendableConversationId(
    ownerId: string
  ): Promise<string> {
    const current = conversationIdRef.current
    if (current && (await isValidWebSessionId(ownerId, current))) return current
    const next = await newWebSessionId(ownerId)
    conversationIdRef.current = next
    setConversationId(next)
    const store = readChatStore(chatOwnerId)
    const isStoredThread = store.conversations.some((c) => c.id === current)
    if (!isStoredThread) {
      writeChatStore(chatOwnerId, setActiveConversation(store, next))
    }
    return next
  }

  async function handleSend(content: string) {
    if (sending) return

    const userMessage = content.trim()
    if (!userMessage) return

    closeHistoryPanelIfNeeded()
    stickToBottomRef.current = true

    if (authLoading) return

    if (!isAuthenticated && guestTrialExhausted) {
      setDraft(userMessage)
      promptGuestTrialExhausted({ trial: guestTrial })
      return
    }

    let sendOwnerId: string | null = chatOwnerId
    if (!isAuthenticated) {
      try {
        const session = await ensureGuestSession()
        sendOwnerId = session.user_id
        setGuestOwnerId(session.user_id)
        setGuestTrial(session.trial)
        setGuestUnavailable(false)
        setGuestSendError(null)
        if (session.trial.messages_remaining <= 0) {
          setDraft(userMessage)
          promptGuestTrialExhausted({ trial: session.trial })
          return
        }
      } catch (error) {
        if (error instanceof GuestChatError) {
          if (error.trial) setGuestTrial(error.trial)
          if (error.code === "guest_unavailable") {
            setGuestUnavailable(true)
            setGuestSendError(t("guestSendBlocked"))
            trackChatMessageBlockedGuest()
            return
          }
          if (error.code === "upstream_unreachable") {
            setGuestUnavailable(false)
            setGuestSendError(t("guestChatUpstreamUnreachable"))
            trackChatMessageBlockedGuest()
            return
          }
          if (
            error.code === "login_required" ||
            (error.trial?.messages_remaining ?? 0) <= 0
          ) {
            setDraft(userMessage)
            promptGuestTrialExhausted({ trial: error.trial })
            return
          }
        }
        throw error
      }
    } else {
      if (!getStoredAccessToken()) {
        await refresh()
      }
      if (!getStoredAccessToken()) {
        login({ source: "chat" })
        return
      }
      if (!chatOwnerId) return
      sendOwnerId = chatOwnerId
    }

    if (!sendOwnerId) return
    const activeId = await ensureSendableConversationId(sendOwnerId)

    trackChatMessageSent({
      conversation_id: activeId,
      message_length: userMessage.length,
    })

    if (isLowSignalUserMessage(userMessage)) {
      const assistantId = crypto.randomUUID()
      const reply = t("lowSignalUserReply")
      const nextHistory: CoPilotHistoryMessage[] = [
        ...history,
        { role: "user", content: userMessage },
        { role: "assistant", content: reply },
      ]
      setHistory(nextHistory)
      setMessagesAndPersist(
        (prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: userMessage },
          { id: assistantId, role: "assistant", content: reply },
        ],
        { id: activeId, history: nextHistory, ownerId: chatOwnerId }
      )
      return
    }

    const assistantId = crypto.randomUUID()
    const optimisticUserId = crypto.randomUUID()
    const replyToId = replyTarget?.id
    const historySnapshot = history

    const displayUserMessage = summarizeSignalUserMessage(
      userMessage,
      t("composerToolSignalLabel")
    )
    const withUser: ChatUiMessage[] = [
      ...messages,
      { id: optimisticUserId, role: "user", content: displayUserMessage },
      { id: assistantId, role: "assistant", content: "" },
    ]
    setMessages(withUser)

    await runAssistantRequest({
      userMessage,
      historySnapshot,
      assistantId,
      activeId,
      optimisticUserId,
      replyToId,
    })
  }

  const handleSendRef = React.useRef(handleSend)
  handleSendRef.current = handleSend
  const landingChatQueryHandledRef = React.useRef(false)

  const onAnalyzeNews = React.useEffectEvent((item: NewsItem) => {
    const title = item.title?.trim()
    if (!title) return
    if (sendingRef.current) {
      toast.message(t("analyzeNewsBusy"))
      return
    }
    const prompt = `"${title}"\n\n${t("analyzeNewsInstruction")}`
    setNewsOpen(false)
    void handleSendRef.current(prompt)
  })

  React.useEffect(() => {
    const question = searchParams.get(LANDING_CHAT_QUERY_PARAM)?.trim()
    if (!question || landingChatQueryHandledRef.current) return
    if (authLoading || !hydrated) return

    landingChatQueryHandledRef.current = true

    const params = new URLSearchParams(searchParams.toString())
    params.delete(LANDING_CHAT_QUERY_PARAM)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })

    void handleSendRef.current(question)
  }, [authLoading, hydrated, pathname, router, searchParams])

  async function handleRetry(assistantId: string) {
    if (sending || authLoading) return

    let sendOwnerId: string | null = chatOwnerId
    if (!isAuthenticated) {
      if (guestUnavailable) return
      if (guestTrialExhausted) {
        setGuestTrialExhaustedOpen(true)
        return
      }
      try {
        const session = await ensureGuestSession()
        sendOwnerId = session.user_id
        setGuestOwnerId(session.user_id)
      } catch {
        return
      }
    } else if (!getStoredAccessToken()) {
      login({ source: "chat" })
      return
    }

    const target = messages.find((m) => m.id === assistantId)
    const userMessage = getRetryUserMessage(target)
    if (!userMessage || !target?.error) return

    if (
      isAuthenticated &&
      (target.errorText === COPILOT_CREDIT_MESSAGE ||
        target.errorText === COPILOT_PRO_SESSION_REFRESH_MESSAGE)
    ) {
      await refreshAfterUpgrade()
    }

    if (!sendOwnerId) return
    const activeId = await ensureSendableConversationId(sendOwnerId)

    // History for retry = API history before this failed turn (do not include partial).
    // Current `history` state was not advanced on failure — safe to reuse.
    const historySnapshot = history
    const assistantIndex = messages.findIndex((m) => m.id === assistantId)
    const priorUser =
      assistantIndex > 0 ? messages[assistantIndex - 1] : undefined
    const optimisticUserId =
      priorUser?.role === "user" ? priorUser.id : crypto.randomUUID()
    const replyToId =
      priorUser?.role === "user" ? priorUser.replyToId : undefined
    setMessages(prepareMessagesForRetry(messages, assistantId))

    await runAssistantRequest({
      userMessage,
      historySnapshot,
      assistantId,
      activeId,
      optimisticUserId,
      replyToId,
    })
  }

  const showDesktopLayoutControls =
    isDesktop === true && !onClose && Boolean(onDisplayModeChange)

  const isFocusedLayout = displayMode === "focused" && !onClose
  const isMobileOverlay = Boolean(onClose)
  const threadTransitionRef = useChatThreadTransition(
    conversationId,
    isMobileOverlay,
    textDir
  )
  const {
    showMenuSpotlight,
    showNewsSpotlight,
    dismissNewsSpotlight,
    acknowledgeNewsSpotlightMenu,
  } = useNewsSpotlight(isMobileOverlay)
  const canEmbedHistoryRail = !isMobileOverlay && isDesktop === true
  const historyRailVisible = canEmbedHistoryRail
  const showFocusedMainHeader = isFocusedLayout && !isAuthenticated
  const showMainHeader = showFocusedMainHeader || !isFocusedLayout
  const showMainColumnHeader =
    showMainHeader && !historyRailVisible && !isMobileOverlay
  const showHistoryPanel =
    !historyRailVisible &&
    !isMobileOverlay &&
    historyOpen &&
    !isFocusedLayout &&
    displayMode === "docked"
  const showThread = !showHistoryPanel
  const activeConversation = conversations.find(
    (chat) => chat.id === conversationId
  )
  const threadHasUserMessages = hasUserMessages(messages)
  const showThreadToolbarInHeader =
    showThread && threadHasUserMessages && showMainColumnHeader
  const showStandaloneThreadToolbar =
    showThread &&
    threadHasUserMessages &&
    !showMainColumnHeader &&
    !isMobileOverlay
  const threadTitleRaw =
    activeConversation?.title?.trim() || conversationTitleFromMessages(messages)
  const threadTitle =
    !threadTitleRaw || threadTitleRaw === NEW_CHAT_TITLE
      ? t("newChat")
      : threadTitleRaw

  React.useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport || !showThread) {
      setShowScrollDown(false)
      return
    }

    function syncScrollDown() {
      const el = scrollViewportRef.current
      if (!el) return
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <
        CHAT_SCROLL_BOTTOM_THRESHOLD
      stickToBottomRef.current = nearBottom
      const next = !nearBottom && el.scrollHeight > el.clientHeight
      setShowScrollDown((prev) => (prev === next ? prev : next))
    }

    let raf = 0
    function onScroll() {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        syncScrollDown()
      })
    }

    syncScrollDown()
    viewport.addEventListener("scroll", onScroll, { passive: true })

    const content = viewport.firstElementChild
    const resizeObserver =
      content && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onScroll)
        : null
    if (content && resizeObserver) resizeObserver.observe(content)

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      viewport.removeEventListener("scroll", onScroll)
      resizeObserver?.disconnect()
    }
  }, [showThread, conversationId, messages.length])

  async function shareCurrentConversation() {
    const title =
      threadTitleRaw && threadTitleRaw !== NEW_CHAT_TITLE
        ? threadTitleRaw
        : undefined
    const text = formatConversationTranscript(messages, {
      title,
      history: activeConversation?.history,
    })
    return copyTextToClipboard(text)
  }

  function downloadCurrentConversation() {
    const title =
      threadTitleRaw && threadTitleRaw !== NEW_CHAT_TITLE
        ? threadTitleRaw
        : undefined
    const markdown = formatConversationMarkdown(messages, {
      title,
      history: activeConversation?.history,
    })
    return downloadTextFile(
      conversationMarkdownFilename(title ?? threadTitle),
      markdown
    )
  }

  function deleteCurrentConversation() {
    removeConversation(conversationId)
  }

  function openNewsFromChat() {
    dismissNewsSpotlight()
    setHistoryOpen(false)
    // Defer so the history overlay click doesn't dismiss the sheet on open.
    window.setTimeout(() => {
      setNewsOpen(true)
    }, 0)
  }

  const mobileGreetingName = resolveUserDisplayName(user)
  const mobileGreetingFirstName =
    mobileGreetingName?.split(/\s+/)[0] ?? mobileGreetingName
  const mobileGreeting = mobileGreetingFirstName
    ? t.rich("mobileGreeting", {
        name: mobileGreetingFirstName,
        highlight: (chunks) => (
          <span className="chat-empty-hero-name">{chunks}</span>
        ),
      })
    : t("mobileGreetingGuest")
  const [mobileComposerFocused, setMobileComposerFocused] =
    React.useState(false)
  const [mobileHeroIntro, setMobileHeroIntro] = React.useState(true)
  const [showMobileEmptyHero, setShowMobileEmptyHero] = React.useState(
    messages.length === 0
  )

  const mobileGeminiPhase = resolveMobileGeminiVisualPhase({
    isMobileOverlay,
    messageCount: messages.length,
    composerFocused: mobileComposerFocused,
    sending,
  })
  const mobileGeminiBackgroundVisible = isMobileGeminiBackgroundVisible(
    mobileGeminiPhase,
    messages.length
  )
  const mobileGeminiBackgroundActive =
    isMobileGeminiBackgroundActive(mobileGeminiPhase)

  React.useEffect(() => {
    if (isMobileOverlay && messages.length === 0) {
      setMobileHeroIntro(true)
    }
  }, [conversationId, isMobileOverlay, messages.length])

  React.useEffect(() => {
    if (messages.length === 0) {
      setShowMobileEmptyHero(true)
      return
    }
    if (!isMobileOverlay) {
      setShowMobileEmptyHero(false)
      return
    }
    const timer = window.setTimeout(() => setShowMobileEmptyHero(false), 360)
    return () => window.clearTimeout(timer)
  }, [isMobileOverlay, messages.length])

  React.useEffect(() => {
    setHistoryRailCollapsed(readHistoryRailCollapsed())
  }, [])

  React.useEffect(() => {
    if (displayMode === "focused" && isAuthenticated) {
      setHistoryOpen(true)
    }
  }, [displayMode, isAuthenticated])

  function toggleHistoryRailCollapsed() {
    setHistoryRailCollapsed((prev) => {
      const next = !prev
      writeHistoryRailCollapsed(next)
      return next
    })
  }

  const showMobileSkeleton = Boolean(onClose) && (authLoading || !hydrated)

  if (showDeskSkeleton || showMobileSkeleton) {
    return (
      <ChatAsideSkeleton
        className={className}
        variant={onClose ? "mobile" : "docked"}
        sidebarWidth={shellSidebars.chat.minSize}
        isAuthenticated={isAuthenticated}
      />
    )
  }

  return (
    <aside
      id={isPrimaryContent ? MAIN_CONTENT_ID : undefined}
      tabIndex={isPrimaryContent ? -1 : undefined}
      data-slot="chat-aside"
      dir={textDir}
      className={cn(
        "relative flex h-full min-h-0 w-full overflow-hidden outline-none",
        isMobileOverlay
          ? "flex-col bg-background text-foreground"
          : historyRailVisible || isFocusedLayout
            ? cn("flex-row text-foreground", chatDesktopCanvasClass)
            : "flex-col bg-sidebar text-sidebar-foreground",
        displayMode === "docked" && !isMobileOverlay
          ? "rounded-e-2xl"
          : "rounded-none",
        className
      )}
    >
      {isMobileOverlay ? (
        <ChatMobileGeminiBackground
          visible={mobileGeminiBackgroundVisible}
          active={mobileGeminiBackgroundActive}
          loading={sending && messages.length === 0}
          intro={mobileHeroIntro && messages.length === 0}
          tone="blue"
        />
      ) : null}
      {historyRailVisible ? (
        <ChatHistoryRail
          conversations={conversations}
          conversationId={conversationId}
          sending={sending}
          deletingIds={deletingIds}
          onSelect={openConversation}
          onDelete={removeConversation}
          onRename={renameConversation}
          onTogglePin={toggleConversationPin}
          onNewChat={startNewChat}
          sidebarWidth={shellSidebars.chat.minSize}
          footer={<ChatAccountFooter collapsed={historyRailCollapsed} />}
          collapsed={historyRailCollapsed}
          onToggleCollapsed={toggleHistoryRailCollapsed}
          onOpenNews={openNewsFromChat}
          showNewsSpotlight={showNewsSpotlight}
        />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          isMobileOverlay
            ? "bg-transparent text-foreground"
            : chatDesktopCanvasClass,
          isMobileOverlay &&
            (mobileGeminiPhase === "empty" ||
              mobileGeminiPhase === "focused" ||
              mobileGeminiPhase === "streaming") &&
            "chat-mobile-gemini-empty",
          isMobileOverlay &&
            mobileGeminiPhase === "threaded" &&
            "chat-mobile-gemini-threaded"
        )}
        data-gemini-phase={mobileGeminiPhase ?? undefined}
      >
        {isMobileOverlay ? (
          <ChatMobileHeader
            historyOpen={historyOpen}
            showMenuSpotlight={showMenuSpotlight}
            onOpenHistory={() => {
              setHistoryOpen((open) => {
                const next = !open
                if (next) acknowledgeNewsSpotlightMenu()
                return next
              })
            }}
            effort={effort}
            onEffortChange={onEffortChange}
            onNewChat={startNewChat}
            onOpenNews={openNewsFromChat}
            sending={sending}
            threadMenu={
              showThread && threadHasUserMessages
                ? {
                    title: threadTitle,
                    pinned: Boolean(activeConversation?.pinned),
                    disabled: sending,
                    onShare: shareCurrentConversation,
                    onDownload: downloadCurrentConversation,
                    onRename: (title) =>
                      renameConversation(conversationId, title),
                    onTogglePin: () => toggleConversationPin(conversationId),
                    onDelete: deleteCurrentConversation,
                  }
                : undefined
            }
          />
        ) : null}
        {isMobileOverlay ? (
          <ChatMobileSlidePanel
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            side="start"
            label={t("chatHistory")}
            panelClassName="bg-background"
          >
            <ChatHistorySidebar
              variant="mobile-drawer"
              conversations={conversations}
              conversationId={conversationId}
              sending={sending}
              deletingIds={deletingIds}
              onSelect={openConversation}
              onDelete={removeConversation}
              onRename={renameConversation}
              onTogglePin={toggleConversationPin}
              onNewChat={startNewChat}
              onClose={() => setHistoryOpen(false)}
              onOpenNews={openNewsFromChat}
              showNewsSpotlight={showNewsSpotlight}
              showBrandHeader={false}
              className="min-h-0 flex-1"
            />
          </ChatMobileSlidePanel>
        ) : null}
        {showMainColumnHeader ? (
          <header
            className={cn(
              "flex min-h-12 shrink-0 items-center gap-1 px-2 sm:gap-2 sm:px-3",
              onClose && "app-mobile-safe-header"
            )}
          >
            <Link
              href="/"
              aria-label={common("brand")}
              className="shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ExurLogo
                decorative
                variant="gradient"
                size={28}
                className="size-7 shrink-0 overflow-hidden rounded-full"
                priority
              />
            </Link>
            <div className="min-w-0 flex-1">
              <span className="block text-sm leading-none font-medium tracking-tight">
                {t("iris")}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {isAuthenticated
                  ? (formatCreditUsageCompact(creditBalance) ??
                    displayPlanName(user?.tier))
                  : guestUnavailable
                    ? t("copilotGuestUnavailable")
                    : guestTrial
                      ? formatGuestTrialLabel(guestTrial)
                      : t("copilotGuestTry")}
              </span>
            </div>
            {!isMobileOverlay ? (
              <ChatAccountMenu
                variant="desktop"
                onOpenNews={openNewsFromChat}
              />
            ) : null}
            {showThreadToolbarInHeader &&
            !isMobileOverlay &&
            isAuthenticated &&
            !isProUser ? (
              <ChatThreadUpgradeButton />
            ) : !showThreadToolbarInHeader &&
              !isMobileOverlay &&
              isAuthenticated &&
              !isProUser ? (
              <Button
                size="sm"
                className={chatThreadUpgradeClass}
                nativeButton={false}
                render={<Link href={UPGRADE_PATH} />}
              >
                {t("upgrade")}
              </Button>
            ) : null}
            {showDesktopLayoutControls &&
            !isFocusedLayout &&
            !historyRailVisible ? (
              <ChatHeaderIconButton
                label={t("fullScreenChat")}
                onClick={() => onDisplayModeChange?.("focused")}
              >
                <Maximize2Icon />
              </ChatHeaderIconButton>
            ) : null}
            {isAuthenticated && !isFocusedLayout && !historyRailVisible ? (
              <ChatHeaderIconButton
                label={t("chatHistory")}
                pressed={historyOpen}
                onClick={() => setHistoryOpen((v) => !v)}
              >
                <HistoryIcon />
              </ChatHeaderIconButton>
            ) : null}
            {!isFocusedLayout ? (
              <ChatHeaderIconButton
                label={t("newChat")}
                onClick={startNewChat}
                disabled={sending}
              >
                <ChatGeminiNewChatIcon className="h-4" />
              </ChatHeaderIconButton>
            ) : null}
            {showThreadToolbarInHeader ? (
              <ChatThreadOptionsMenu
                title={threadTitle}
                pinned={Boolean(activeConversation?.pinned)}
                disabled={sending}
                onShare={shareCurrentConversation}
                onDownload={downloadCurrentConversation}
                onRename={(title) => renameConversation(conversationId, title)}
                onTogglePin={() => toggleConversationPin(conversationId)}
                onDelete={deleteCurrentConversation}
              />
            ) : null}
          </header>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {showStandaloneThreadToolbar ? (
              <ChatThreadToolbar
                title={threadTitle}
                pinned={Boolean(activeConversation?.pinned)}
                disabled={sending}
                showUpgrade={!isMobileOverlay && isAuthenticated && !isProUser}
                onNewChat={startNewChat}
                onShare={shareCurrentConversation}
                onDownload={downloadCurrentConversation}
                onRename={(title) => renameConversation(conversationId, title)}
                onTogglePin={() => toggleConversationPin(conversationId)}
                onDelete={deleteCurrentConversation}
              />
            ) : null}
            {showThread ? (
              <div
                ref={threadTransitionRef}
                className="relative min-h-0 flex-1 overflow-hidden will-change-transform"
              >
                <ScrollArea
                  viewportRef={scrollViewportRef}
                  className={cn(
                    "h-full min-h-0",
                    isMobileOverlay &&
                      messages.length > 0 &&
                      chatMobileThreadScrollMaskClass
                  )}
                >
                  {isMobileOverlay && messages.length > 0 ? (
                    <div
                      aria-hidden
                      className={chatMobileThreadTopSpacerClass}
                    />
                  ) : null}
                  {showMobileEmptyHero ? (
                    <div
                      className={cn(
                        isMobileOverlay
                          ? chatMobileEmptyHeroWrapClass
                          : "flex min-h-full flex-col items-center justify-center px-4 py-10",
                        "chat-empty-hero-shell",
                        messages.length > 0 &&
                          cn(
                            "chat-empty-hero-shell-exiting",
                            isMobileOverlay &&
                              "pointer-events-none absolute inset-x-0 top-0 z-1 min-h-0 justify-start pb-0"
                          )
                      )}
                    >
                      <div
                        className={cn("mx-auto w-full", CHAT_CONTENT_MAX_WIDTH)}
                      >
                        <div className={chatMobileEmptyHeroContentClass}>
                          {isMobileOverlay ? (
                            <IrisMark
                              variant="hero"
                              className={chatMobileEmptyHeroMarkClass}
                            />
                          ) : (
                            <IrisMark variant="hero" />
                          )}
                          <h2
                            className={cn(
                              isMobileOverlay
                                ? chatMobileEmptyHeroTitleClass
                                : "max-w-[20rem] text-[28px] leading-8.5 font-light tracking-[0.01em] text-balance text-foreground"
                            )}
                          >
                            {mobileGreeting}
                          </h2>
                          <IrisSamplePrompts
                            disabled={sending}
                            onEdit={(text: string) => {
                              setDraft(text)
                              focusComposer()
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {messages.length > 0 ? (
                    <div
                      className={cn(
                        "mx-auto flex w-full min-w-0 flex-col",
                        isMobileOverlay ? chatMobileThreadClass : "px-4 py-6",
                        CHAT_CONTENT_MAX_WIDTH
                      )}
                    >
                      {messages.map((message, index) => {
                        const prev = messages[index - 1]
                        const sameRole = prev?.role === message.role
                        const isStreamingAssistant =
                          message.id === pendingAssistantId &&
                          message.role === "assistant" &&
                          !message.error
                        const isWaiting =
                          isStreamingAssistant && !message.content
                        const isCreditPaywall =
                          message.errorText === COPILOT_CREDIT_MESSAGE
                        const errorNote =
                          message.error && !isCreditPaywall ? (
                          <span
                            className={cn(
                              "block text-destructive",
                              message.content ? "mt-2" : undefined
                            )}
                          >
                            {localizeCoPilotErrorText(message.errorText, t)}
                          </span>
                        ) : null
                        const actions = (
                          <>
                            {message.action === "connect" ? (
                              <Button
                                type="button"
                                className={chatThreadConnectButtonClass}
                                onClick={() => login({ source: "chat" })}
                              >
                                <GoogleGlyph className="size-4" />
                                {t("continueWithGoogle")}
                              </Button>
                            ) : null}
                            {message.action === "retry" && !isCreditPaywall ? (
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                disabled={sending}
                                aria-label={t("tryAgain")}
                                onClick={() => void handleRetry(message.id)}
                              >
                                <RefreshCwIcon className="size-3.5" />
                              </Button>
                            ) : null}
                            {message.suggestedPrompts?.length ? (
                              <IrisFollowUpPrompts
                                prompts={message.suggestedPrompts}
                                disabled={sending}
                                onSelect={(text) => {
                                  setDraft(text)
                                  focusComposer()
                                }}
                              />
                            ) : null}
                          </>
                        )
                        const showRetry =
                          message.action === "retry" && !isCreditPaywall
                        const hasAction =
                          message.action === "connect" ||
                          showRetry ||
                          Boolean(message.suggestedPrompts?.length)

                        if (message.role === "user") {
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "min-w-0",
                                index === 0 &&
                                  isMobileOverlay &&
                                  chatMobileThreadFirstTurnClass,
                                index > 0 &&
                                  (sameRole
                                    ? "mt-5"
                                    : isMobileOverlay
                                      ? "mt-11"
                                      : "mt-10")
                              )}
                            >
                              <ChatUserTurn
                                messageId={message.id}
                                conversationId={conversationId}
                                content={message.content}
                                createdAt={message.createdAt}
                                replyTo={message.replyTo}
                                disabled={sending}
                                variant={isMobileOverlay ? "gemini" : "default"}
                                onEdit={() => handleEditUserMessage(message.id)}
                              />
                            </div>
                          )
                        }
                        if (message.role === "system") {
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "min-w-0",
                                index === 0 &&
                                  isMobileOverlay &&
                                  chatMobileThreadFirstTurnClass,
                                index > 0 &&
                                  (sameRole
                                    ? "mt-5"
                                    : isMobileOverlay
                                      ? "mt-11"
                                      : "mt-10")
                              )}
                            >
                              <ChatSystemNote
                                variant={isMobileOverlay ? "gemini" : "default"}
                              >
                                <span className="block min-w-0 wrap-anywhere whitespace-pre-wrap">
                                  {message.content}
                                </span>
                                {errorNote}
                              </ChatSystemNote>
                            </div>
                          )
                        }
                        const signalParts =
                          !isWaiting &&
                          !isStreamingAssistant &&
                          (Boolean(message.content?.trim()) ||
                            Boolean(message.paperTicket) ||
                            Boolean(message.noTradeReason))
                            ? splitSignalAssistantMessage({
                                content: message.content ?? "",
                                paperTicket: message.paperTicket,
                              })
                            : null
                        const showSignalCard = Boolean(signalParts?.ticket)
                        const assistantReplyTarget =
                          replyTargetFromMessage(message)
                        const showMessageActions =
                          !isWaiting &&
                          (Boolean(message.content?.trim()) ||
                            Boolean(signalParts?.ticket) ||
                            Boolean(message.paperTicket) ||
                            Boolean(message.noTradeReason)) &&
                          message.action !== "connect"

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "group/turn min-w-0",
                              index === 0 &&
                                isMobileOverlay &&
                                chatMobileThreadFirstTurnClass,
                              index > 0 &&
                                (sameRole
                                  ? "mt-5"
                                  : isMobileOverlay
                                    ? "mt-11"
                                    : "mt-10")
                            )}
                          >
                            <ChatAssistantTurn
                              messageId={message.id}
                              waiting={isWaiting}
                              thinkingTrace={message.thinkingTrace}
                              reasoning={message.reasoning}
                              streaming={
                                isStreamingAssistant && Boolean(message.content)
                              }
                              compact={sameRole}
                              content={
                                showSignalCard ? undefined : message.content
                              }
                              createdAt={message.createdAt}
                              replyTo={message.replyTo}
                              variant={isMobileOverlay ? "gemini" : "default"}
                              actions={hasAction ? actions : undefined}
                              toolbar={
                                showMessageActions ? (
                                  <ChatMessageActions
                                    messageId={message.id}
                                    conversationId={conversationId}
                                    content={message.content}
                                    shareTicket={signalParts?.ticket ?? undefined}
                                    shareNoTradeReason={message.noTradeReason}
                                    feedback={message.feedback}
                                    disabled={sending}
                                    variant={
                                      isMobileOverlay ? "gemini" : "default"
                                    }
                                    onFeedbackChange={(next) =>
                                      setMessageFeedback(message.id, next)
                                    }
                                    onReply={
                                      assistantReplyTarget
                                        ? () =>
                                            setReplyTarget(assistantReplyTarget)
                                        : undefined
                                    }
                                  />
                                ) : undefined
                              }
                            >
                              {signalParts?.leadText ? (
                                <AIMessageRenderer
                                  content={signalParts.leadText}
                                  className={
                                    showSignalCard ? "mb-3" : undefined
                                  }
                                />
                              ) : null}
                              {showSignalCard && signalParts?.ticket ? (
                                <ChatSignalCard ticket={signalParts.ticket} />
                              ) : null}
                              {message.noTradeReason ? (
                                <ChatNoTradeCard
                                  reason={message.noTradeReason}
                                />
                              ) : null}
                              {showSignalCard && signalParts?.tailText ? (
                                <AIMessageRenderer
                                  content={signalParts.tailText}
                                  className="mt-3"
                                />
                              ) : null}
                              {errorNote}
                            </ChatAssistantTurn>
                          </div>
                        )
                      })}
                      <div
                        ref={bottomRef}
                        className={cn(
                          isMobileOverlay && chatMobileThreadBottomSpacerClass
                        )}
                      />
                    </div>
                  ) : null}
                </ScrollArea>
                {isMobileOverlay && messages.length > 0 ? (
                  <div
                    aria-hidden
                    className={chatMobileThreadBottomFadeClass}
                  />
                ) : null}
                {showScrollDown ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className={cn(
                      isMobileOverlay
                        ? chatMobileScrollDownClass
                        : "absolute bottom-3 left-1/2 z-10 size-8 -translate-x-1/2 rounded-full border-border/70 bg-background/95 shadow-md backdrop-blur-sm hover:bg-background"
                    )}
                    aria-label={t("scrollToLatest")}
                    title={t("scrollToLatest")}
                    onClick={() => scrollToChatBottom("smooth")}
                  >
                    <ChevronDownIcon className="size-4" />
                  </Button>
                ) : null}
              </div>
            ) : (
              <ChatHistorySidebar
                conversations={conversations}
                conversationId={conversationId}
                sending={sending}
                deletingIds={deletingIds}
                onSelect={openConversation}
                onDelete={removeConversation}
                onRename={renameConversation}
                onTogglePin={toggleConversationPin}
                onNewChat={startNewChat}
                showBrandHeader={false}
                className="min-h-0 flex-1 bg-sidebar text-sidebar-foreground"
              />
            )}

            {showThread ? (
              <div
                className={cn(
                  "mx-auto w-full",
                  isMobileOverlay
                    ? chatMobileComposerDockClass
                    : "shrink-0 bg-transparent",
                  CHAT_CONTENT_MAX_WIDTH
                )}
              >
                {guestSendError ? (
                  <div className="flex items-start justify-between gap-2 border-b border-border/50 px-3 py-2 sm:px-4">
                    <p className="text-xs leading-snug text-muted-foreground">
                      {guestSendError}
                    </p>
                    {!isAuthenticated ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => login({ source: "chat" })}
                      >
                        {t("signIn")}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {replyTarget ? (
                  <div
                    className={
                      isMobileOverlay ? "px-3 sm:px-4" : "px-3 sm:px-4"
                    }
                  >
                    <ChatReplyChip
                      target={replyTarget}
                      onClear={() => setReplyTarget(null)}
                    />
                  </div>
                ) : null}
                <ChatComposer
                  value={draft}
                  onValueChange={(next) => {
                    setDraft(next)
                    if (guestSendError) setGuestSendError(null)
                  }}
                  textareaRef={composerRef}
                  effort={effort}
                  onEffortChange={onEffortChange}
                  onSend={handleSend}
                  sending={sending}
                  onStop={() => {
                    abortRef.current?.abort()
                  }}
                  layout={isMobileOverlay ? "floating" : "default"}
                  onFloatingFocusChange={
                    isMobileOverlay ? setMobileComposerFocused : undefined
                  }
                  className={isMobileOverlay ? undefined : "px-3 sm:px-4"}
                  isProUser={isProUser}
                />
              </div>
            ) : null}
          </div>
          {!isMobileOverlay ? (
            <ChatNewsSidePanel
              open={newsOpen}
              onOpenChange={setNewsOpen}
              onAnalyzeNews={onAnalyzeNews}
            />
          ) : (
            <ChatNewsMobileSheet
              open={newsOpen}
              onOpenChange={setNewsOpen}
              onAnalyzeNews={onAnalyzeNews}
            />
          )}
          <CreditsExhaustedDialog
            open={creditsExhaustedOpen}
            onOpenChange={setCreditsExhaustedOpen}
            isProUser={isProUser}
          />
          <GuestTrialExhaustedDialog
            open={guestTrialExhaustedOpen}
            onOpenChange={setGuestTrialExhaustedOpen}
            signingIn={loginPending}
            onSignIn={() => login({ source: "chat" })}
          />
        </div>
      </div>
    </aside>
  )
}

export { ChatAside }
