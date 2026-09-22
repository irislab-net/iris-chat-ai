"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  ChevronDownIcon,
  HistoryIcon,
  Maximize2Icon,
} from "lucide-react"

import { ChatAccountFooter } from "@/components/app-shell/chat-account-footer"
import { ChatAccountMenu } from "@/components/app-shell/chat-account-menu"
import { ExurLogo } from "@/components/brand/exur-logo"
import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import { chatMobileScrollDownClass, chatMobileThreadBottomFadeClass, chatMobileThreadBottomSpacerClass, chatMobileThreadClass, chatMobileThreadFirstTurnClass, chatMobileThreadScrollMaskClass, chatMobileEmptyHeroContentClass, chatMobileEmptyHeroMarkClass, chatMobileEmptyHeroTitleClass, chatMobileEmptyHeroWrapClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatMobileHeader } from "@/components/app-shell/chat-mobile-header"
import { ChatGeminiNewChatIcon } from "@/components/app-shell/chat-gemini-new-chat-icon"
import { ChatComposer } from "@/components/app-shell/chat-composer"
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
import { formatConversationTranscript } from "@/lib/chat/transcript"
import { ChatAsideSkeleton } from "@/components/app-shell/shell-skeletons"
import { useTicketSlot } from "@/components/app-shell/ticket-slot"
import { typewriterReveal } from "@/components/app-shell/chat-typing"
import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import dynamic from "next/dynamic"
import { useIsDesktop } from "@/hooks/use-media-query"
import { useNewsSpotlight } from "@/hooks/use-news-spotlight"
import { useShellSidebarLayout } from "@/hooks/use-shell-sidebar-layout"
import { useChatClientContext } from "@/hooks/use-chat-client-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  createChatClientActionHandlers,
  executeChatClientActions,
} from "@/lib/api/chat"
import { submitChatMessageFeedback } from "@/lib/api/chat-feedback"
import {
  deleteChatSession,
  fetchChatSessions,
  applySessionListToStore,
  patchChatSession,
} from "@/lib/api/chat-sessions"
import { fetchCoPilotUsage, streamCoPilotChat } from "@/lib/api/co-pilot"
import {
  consumePlanUpgradePendingRefresh,
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
import type { CoPilotHistoryMessage, ChatCreditBalance, TrialInfo } from "@/lib/api/types"
import { formatCreditUsageCompact } from "@/lib/api/credit-usage"
import {
  trackChatMessageBlockedGuest,
  trackChatMessageSent,
} from "@/lib/analytics"
import {
  ensureGuestSession,
  formatGuestTrialLabel,
  GuestChatError,
} from "@/lib/guest-chat"
import {
  buildFailedAssistantTurn,
  getRetryUserMessage,
  isAbortError,
  isLowSignalUserMessage,
  prepareMessagesForRetry,
  removeEmptyAssistantTurn,
  COPILOT_CREDIT_MESSAGE,
  COPILOT_PRO_SESSION_REFRESH_MESSAGE,
  COPILOT_RECOVERY_MESSAGE,
  coPilotUserFacingError,
  coPilotFailureAction,
  isGuestTrialExhaustedError,
} from "@/lib/co-pilot-recovery"
import {
  conversationTitleFromMessages,
  deleteConversation,
  hasUserMessages,
  readChatStore,
  restoreMessages,
  sanitizeMessages,
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
import { SHELL_SIDEBAR_COMPACT_FALLBACK } from "@/lib/shell-sidebar-layout"
import { stripUnrequestedIrisSetupFromReply } from "@/lib/chat/strip-paper-setup"
import { summarizeSignalUserMessage } from "@/lib/chat/composer-mentions"
import {
  replyTargetFromMessage,
  stampUiMessageFromRef,
} from "@/lib/chat/message-stamp"
import { stripMarketContextAppendix } from "@/lib/iris-paper-trade/prompt"
import {
  isMobileGeminiBackgroundActive,
  isMobileGeminiBackgroundVisible,
  resolveMobileGeminiVisualPhase,
} from "@/lib/chat/mobile-gemini-visual-state"
import { shouldRunPaperTradePipeline } from "@/lib/iris-paper-trade/routing"
import { tryRecoverProposedPaperTradeFromToolFailure } from "@/lib/iris-paper-trade/run"
import { findToolFailureSignalRecoveryTargets } from "@/lib/iris-paper-trade/tool-failure"
import {
  readHistoryRailCollapsed,
  writeHistoryRailCollapsed,
} from "@/lib/chat-history-rail-prefs"
import { cn } from "@/lib/utils"

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

function historyWithRecoveredAssistant(
  history: CoPilotHistoryMessage[],
  messages: ChatUiMessage[],
  messageId: string,
  turnText: string
): CoPilotHistoryMessage[] {
  const messageIndex = messages.findIndex((message) => message.id === messageId)
  if (messageIndex === -1) return history

  let assistantOrdinal = 0
  for (let index = 0; index < messageIndex; index += 1) {
    if (messages[index]?.role === "assistant") assistantOrdinal += 1
  }

  let seenAssistants = 0
  return history.map((item) => {
    if (item.role !== "assistant") return item
    if (seenAssistants === assistantOrdinal) {
      seenAssistants += 1
      return { ...item, content: turnText }
    }
    seenAssistants += 1
    return item
  })
}

type ChatAsideProps = {
  className?: string
  /** Shown on mobile full-screen chat overlay */
  onClose?: () => void
  displayMode?: ChatDisplayMode
  onDisplayModeChange?: (mode: ChatDisplayMode) => void
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

function blankConversation(id = crypto.randomUUID()): {
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

function IrisFollowUpPrompts({
  prompts,
  disabled,
  onSelect,
}: {
  prompts: string[]
  disabled?: boolean
  onSelect: (text: string) => void
}) {
  if (prompts.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        Continue with
      </p>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="ghost"
            size="xs"
            disabled={disabled}
            className="h-auto max-w-full items-start justify-start rounded-xl bg-muted/20 px-2.5 py-1.5 text-left text-[11px] leading-5 font-normal whitespace-normal hover:bg-muted/35"
            onClick={() => onSelect(prompt)}
          >
            {prompt}
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
}: ChatAsideProps) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isDesktop = useIsDesktop()
  const shellSidebars = useShellSidebarLayout() ?? SHELL_SIDEBAR_COMPACT_FALLBACK
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
    if (!consumePlanUpgradePendingRefresh()) return
    void refreshAfterUpgrade()
  }, [authLoading, isAuthenticated, refreshAfterUpgrade])
  const showDeskSkeleton =
    waitForDesk &&
    displayMode === "docked" &&
    !authLoading &&
    !ticketSlot?.occupied &&
    !deskWaitTimedOut
  const chatClientContext = useChatClientContext({ user, isProUser })
  const chatClientActions = React.useMemo(
    () =>
      createChatClientActionHandlers({
        navigate: (href) => router.push(href),
      }),
    [router]
  )
  /** Stable backend user id when signed in; null for guest (isolated bucket). */
  const chatOwnerId = isAuthenticated && user?.id ? user.id : null
  const [hydrated, setHydrated] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatUiMessage[]>([])
  const [history, setHistory] = React.useState<CoPilotHistoryMessage[]>([])
  const [conversationId, setConversationId] = React.useState(() =>
    crypto.randomUUID()
  )
  const [conversations, setConversations] = React.useState<StoredConversation[]>(
    []
  )
  const [sending, setSending] = React.useState(false)
  const sendingRef = React.useRef(false)
  sendingRef.current = sending
  const [newsOpen, setNewsOpen] = React.useState(false)
  const [historyRailCollapsed, setHistoryRailCollapsed] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(
    () => displayMode === "focused"
  )
  const [pendingAssistantId, setPendingAssistantId] = React.useState<string | null>(
    null
  )
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const scrollViewportRef = React.useRef<HTMLDivElement>(null)
  const stickToBottomRef = React.useRef(true)
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
  const signalRecoveryAttemptedRef = React.useRef(new Set<string>())
  const [session, setSession] = React.useState<string>("pending")
  const [guestTrial, setGuestTrial] = React.useState<TrialInfo | null>(null)
  const [creditBalance, setCreditBalance] =
    React.useState<ChatCreditBalance | null>(null)
  const [guestUnavailable, setGuestUnavailable] = React.useState(false)
  const [guestSendError, setGuestSendError] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    if (authLoading || isAuthenticated) {
      setGuestTrial(null)
      setGuestUnavailable(false)
      return
    }

    let cancelled = false
    void ensureGuestSession()
      .then((session) => {
        if (!cancelled) {
          setGuestTrial(session.trial)
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

  React.useEffect(() => {
    signalRecoveryAttemptedRef.current.clear()
  }, [conversationId])

  React.useEffect(() => {
    if (sending) return

    const targets = findToolFailureSignalRecoveryTargets(messages).filter(
      (target) => !signalRecoveryAttemptedRef.current.has(target.messageId)
    )
    if (targets.length === 0) return

    let cancelled = false

    void (async () => {
      for (const target of targets) {
        signalRecoveryAttemptedRef.current.add(target.messageId)
        const current = messages.find((message) => message.id === target.messageId)
        if (!current || current.paperTicket) continue

        const recovered = await tryRecoverProposedPaperTradeFromToolFailure({
          userMessage: target.userMessage,
          assistantMessage: current.content,
        })
        if (cancelled || !recovered) continue

        const turnText = recovered.message.trim()

        setMessagesAndPersist(
          (prev) =>
            prev.map((message) =>
              message.id === target.messageId
                ? {
                    ...message,
                    content: turnText,
                    paperTicket: recovered.ticket,
                  }
                : message
            ),
          {
            id: conversationId,
            history: historyWithRecoveredAssistant(
              history,
              messages,
              target.messageId,
              turnText
            ),
            ownerId: chatOwnerId,
          }
        )
        setHistory((prev) =>
          historyWithRecoveredAssistant(
            prev,
            messages,
            target.messageId,
            turnText
          )
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [messages, sending, conversationId, history, chatOwnerId])

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
      const blank = blankConversation()
      setConversationId(blank.id)
      setMessages(blank.messages)
      setHistory(blank.history)
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
        setConversations(store.conversations)
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
    session,
  ])

  const scrollToChatBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const viewport = scrollViewportRef.current
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior })
      }
      stickToBottomRef.current = true
      setShowScrollDown(false)
    },
    []
  )

  React.useEffect(() => {
    if (!stickToBottomRef.current) return
    const viewport = scrollViewportRef.current
    if (!viewport) return
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "auto" })
  }, [messages, historyOpen, pendingAssistantId])

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

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
      setConversationId(crypto.randomUUID())
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

  function startNewChat() {
    abortRef.current?.abort()
    abortRef.current = null
    setSending(false)
    setPendingAssistantId(null)
    closeHistoryPanelIfNeeded()

    if (hasUserMessages(messages)) {
      persistCurrent({ id: conversationId, messages, history, ownerId: chatOwnerId })
    }

    const blank = blankConversation()
    setConversationId(blank.id)
    setMessages(blank.messages)
    setHistory(blank.history)
    setDraft("")
    setReplyTarget(null)
    setEffort(DEFAULT_CHAT_EFFORT)
    writeChatEffort(DEFAULT_CHAT_EFFORT)
    const store = setActiveConversation(readChatStore(chatOwnerId), blank.id)
    writeChatStore(chatOwnerId, store)
  }

  function openConversation(id: string) {
    if (sending) return
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

  function removeConversation(id: string, event?: React.MouseEvent) {
    event?.stopPropagation()
    const store = deleteConversation(readChatStore(chatOwnerId), id)
    writeChatStore(chatOwnerId, store)
    setConversations(store.conversations)

    if (id === conversationId) {
      const blank = blankConversation()
      setConversationId(blank.id)
      setMessages(blank.messages)
      setHistory(blank.history)
      setReplyTarget(null)
      writeChatStore(
        chatOwnerId,
        setActiveConversation(store, blank.id)
      )
    }

    if (chatOwnerId) {
      void deleteChatSession(id).catch(() => {})
    }
  }

  function renameConversation(id: string, title: string) {
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
    const displayUserMessage = summarizeSignalUserMessage(userMessage)

    setSending(true)
    setPendingAssistantId(assistantId)
    window.clearTimeout(persistTimer.current)

    const controller = new AbortController()
    abortRef.current = controller
    let partialContent = ""

    if (shouldRunPaperTradePipeline(userMessage, historySnapshot)) {
      try {
        const { runIrisPaperTradeRequest } = await import(
          "@/lib/iris-paper-trade/run"
        )
        const result = await runIrisPaperTradeRequest({
          userMessage,
          conversationId: activeId,
          history: historySnapshot,
          effort,
          signal: controller.signal,
          onPhase: (phase) => {
            const text =
              phase === "context"
                ? t("fetchingContext")
                : t("evaluatingSetup")
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: text, error: false, action: undefined }
                  : m
              )
            )
          },
        })

        if (controller.signal.aborted) {
          setMessages((prev) => removeEmptyAssistantTurn(prev, assistantId))
          return
        }

        const finalId = activeId
        const fullText = result.message.trim()
        const parsedTicket =
          result.status === "proposed" ? result.ticket : undefined
        const finalHistory: CoPilotHistoryMessage[] = [
          ...historySnapshot,
          { role: "user", content: displayUserMessage },
          { role: "assistant", content: fullText },
        ]
        setHistory(finalHistory)
        setPendingAssistantId(null)
        setReplyTarget(null)
        setMessagesAndPersist(
          (prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: fullText,
                    error: false,
                    action: undefined,
                    paperTicket: parsedTicket ?? undefined,
                    clientActionSummaries: undefined,
                    retryUserMessage: undefined,
                  }
                : m
            ),
          {
            id: finalId,
            history: finalHistory,
            ownerId: chatOwnerId,
          }
        )
      } catch (error) {
        if (isAbortError(error)) {
          setMessages((prev) => removeEmptyAssistantTurn(prev, assistantId))
          return
        }

        setPendingAssistantId(null)
        if (!isAuthenticated && isGuestTrialExhaustedError(error)) {
          replaceAssistantWithGuestLoginPrompt(
            assistantId,
            activeId,
            historySnapshot,
            (error as { trial?: TrialInfo }).trial
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
                  action: coPilotFailureAction(error),
                  retryUserMessage: failed.retryUserMessage,
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
      return
    }

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
      const clientResult = executeChatClientActions(
        result.clientActions,
        chatClientActions
      )

      let fullText = (result.message || "").trim()
      if (fullText) {
        fullText = stripUnrequestedIrisSetupFromReply(fullText)
        fullText = stripMarketContextAppendix(fullText)
      }

      if (!fullText && !clientResult.paperTicket && !clientResult.noTradeReason) {
        throw new Error("Exur returned an empty reply. Please try again.")
      }

      const recovered = fullText
        ? await tryRecoverProposedPaperTradeFromToolFailure({
            userMessage,
            assistantMessage: fullText,
            signal: controller.signal,
          })
        : null

      let turnText = fullText
      const recoveredTicket = recovered?.ticket

      if (recovered) {
        turnText = recovered.message.trim()
      }

      const signalTicket = recoveredTicket ?? clientResult.paperTicket
      // History needs prose when output_text is empty but a signal card arrived.
      const historyAssistantText =
        turnText ||
        signalTicket?.thesis?.trim() ||
        (signalTicket
          ? `${signalTicket.side} ${signalTicket.symbol}`
          : "") ||
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
        // Only attach a ticket the API returned (client_actions) or an explicit
        // tool-failure recovery — never invent a Signal card from model prose.
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
        turnText || historyAssistantText,
        recoveredTicket
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
      const trial = (error as { trial?: TrialInfo }).trial
      if (trial) setGuestTrial(trial)
      if (!isAuthenticated && isGuestTrialExhaustedError(error)) {
        replaceAssistantWithGuestLoginPrompt(
          assistantId,
          activeId,
          historySnapshot,
          trial
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
                  action: coPilotFailureAction(error),
                  retryUserMessage: failed.retryUserMessage,
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

  function appendGuestLoginRequiredTurn(
    userMessage: string,
    trial?: TrialInfo | null
  ) {
    if (trial) setGuestTrial(trial)
    setMessagesAndPersist(
      (prev) => {
        const last = prev.at(-1)
        const lastUser = prev.at(-2)
        if (
          last?.role === "assistant" &&
          last.action === "connect" &&
          lastUser?.role === "user" &&
          lastUser.content === userMessage
        ) {
          return prev
        }
        return [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: userMessage },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: t("guestTrialExhaustedPrompt"),
            action: "connect",
          },
        ]
      },
      { id: conversationId, history, ownerId: chatOwnerId }
    )
  }

  function replaceAssistantWithGuestLoginPrompt(
    assistantId: string,
    activeId: string,
    historySnapshot: CoPilotHistoryMessage[],
    trial?: TrialInfo | null
  ) {
    if (trial) setGuestTrial(trial)
    setMessagesAndPersist(
      (prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: t("guestTrialExhaustedPrompt"),
                error: false,
                action: "connect" as const,
                errorText: undefined,
                retryUserMessage: undefined,
              }
            : m
        ),
      { id: activeId, history: historySnapshot, ownerId: chatOwnerId }
    )
  }

  async function handleSend(content: string) {
    if (sending) return

    const userMessage = content.trim()
    if (!userMessage) return

    closeHistoryPanelIfNeeded()
    stickToBottomRef.current = true

    if (authLoading) return

    if (!isAuthenticated && guestTrialExhausted) {
      appendGuestLoginRequiredTurn(userMessage, guestTrial)
      return
    }

    if (!isAuthenticated) {
      try {
        const session = await ensureGuestSession()
        setGuestTrial(session.trial)
        setGuestUnavailable(false)
        setGuestSendError(null)
        if (session.trial.messages_remaining <= 0) {
          appendGuestLoginRequiredTurn(userMessage, session.trial)
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
            appendGuestLoginRequiredTurn(userMessage, error.trial)
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
    }

    trackChatMessageSent({
      conversation_id: conversationId,
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
        { id: conversationId, history: nextHistory, ownerId: chatOwnerId }
      )
      return
    }

    const assistantId = crypto.randomUUID()
    const optimisticUserId = crypto.randomUUID()
    const replyToId = replyTarget?.id
    const historySnapshot = history
    const activeId = conversationId

    const displayUserMessage = summarizeSignalUserMessage(userMessage)
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

    if (!isAuthenticated) {
      if (guestUnavailable) return
      if (guestTrialExhausted) return
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

    // History for retry = API history before this failed turn (do not include partial).
    // Current `history` state was not advanced on failure — safe to reuse.
    const historySnapshot = history
    const activeId = conversationId
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
  const showMobileHistoryOverlay = isMobileOverlay && historyOpen
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
  const threadTitle =
    activeConversation?.title?.trim() ||
    conversationTitleFromMessages(messages)

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
    const text = formatConversationTranscript(messages)
    if (!text.trim()) return
    await navigator.clipboard.writeText(text)
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
  const [mobileComposerFocused, setMobileComposerFocused] = React.useState(false)
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
  const mobileGeminiBackgroundActive = isMobileGeminiBackgroundActive(
    mobileGeminiPhase
  )

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
      data-slot="chat-aside"
      className={cn(
        "relative flex h-full min-h-0 w-full overflow-hidden",
        isMobileOverlay
          ? "flex-col bg-background text-foreground"
          : historyRailVisible || isFocusedLayout
            ? "flex-row bg-sidebar text-sidebar-foreground"
            : "flex-col bg-sidebar text-sidebar-foreground",
        displayMode === "docked" && !isMobileOverlay ? "rounded-r-2xl" : "rounded-none",
        className
      )}
    >
      {isMobileOverlay ? (
        <ChatMobileGeminiBackground
          visible={mobileGeminiBackgroundVisible}
          active={mobileGeminiBackgroundActive}
          loading={sending && messages.length === 0}
          intro={mobileHeroIntro && messages.length === 0}
        />
      ) : null}
      {historyRailVisible ? (
        <ChatHistoryRail
          conversations={conversations}
          conversationId={conversationId}
          sending={sending}
          onSelect={openConversation}
          onDelete={removeConversation}
          onRename={renameConversation}
          onTogglePin={toggleConversationPin}
          onNewChat={startNewChat}
          sidebarWidth={shellSidebars.chat.minSize}
          footer={
            <ChatAccountFooter collapsed={historyRailCollapsed} />
          }
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
            : "bg-background text-foreground",
          isMobileOverlay &&
            (mobileGeminiPhase === "empty" ||
              mobileGeminiPhase === "focused" ||
              mobileGeminiPhase === "streaming") &&
            "chat-mobile-gemini-empty",
          isMobileOverlay && mobileGeminiPhase === "threaded" && "chat-mobile-gemini-threaded"
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
                  onRename: (title) =>
                    renameConversation(conversationId, title),
                  onTogglePin: () => toggleConversationPin(conversationId),
                  onDelete: deleteCurrentConversation,
                }
              : undefined
          }
        />
      ) : null}
      {showMobileHistoryOverlay ? (
        <div className="absolute inset-0 z-30 flex min-h-0 flex-col bg-background">
          <ChatHistorySidebar
            variant="mobile-drawer"
            conversations={conversations}
            conversationId={conversationId}
            sending={sending}
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
        </div>
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
          <span className="block text-sm font-medium leading-none tracking-tight">
            {t("iris")}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {isAuthenticated
              ? formatCreditUsageCompact(creditBalance) ??
                displayPlanName(user?.tier)
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
            size="xs"
            variant="outline"
            className="hidden shrink-0 sm:inline-flex"
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
            onRename={(title) => renameConversation(conversationId, title)}
            onTogglePin={() => toggleConversationPin(conversationId)}
            onDelete={deleteCurrentConversation}
          />
        ) : null}
      </header>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showStandaloneThreadToolbar ? (
            <ChatThreadToolbar
              title={threadTitle}
              pinned={Boolean(activeConversation?.pinned)}
              disabled={sending}
              showUpgrade={
                !isMobileOverlay && isAuthenticated && !isProUser
              }
              onShare={shareCurrentConversation}
              onRename={(title) => renameConversation(conversationId, title)}
              onTogglePin={() => toggleConversationPin(conversationId)}
              onDelete={deleteCurrentConversation}
            />
          ) : null}
          {showThread ? (
            <div className="relative min-h-0 flex-1 overflow-hidden">
            <ScrollArea
              viewportRef={scrollViewportRef}
              className={cn(
                "h-full min-h-0",
                isMobileOverlay &&
                  messages.length > 0 &&
                  chatMobileThreadScrollMaskClass
              )}
            >
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
                  <div className={cn("mx-auto w-full", CHAT_CONTENT_MAX_WIDTH)}>
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
                            : "max-w-[20rem] text-balance text-[1.75rem] font-light leading-[1.22] tracking-[-0.028em] text-foreground"
                        )}
                      >
                        {mobileGreeting}
                      </h2>
                      <IrisSamplePrompts
                        disabled={sending}
                        onEdit={(text) => {
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
                    isMobileOverlay ? chatMobileThreadClass : "px-4 py-4",
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
              const isWaiting = isStreamingAssistant && !message.content
              const errorNote =
                message.error ? (
                  <span
                    className={cn(
                      "block text-destructive",
                      message.content ? "mt-2" : undefined
                    )}
                  >
                    {message.errorText || COPILOT_RECOVERY_MESSAGE}
                  </span>
                ) : null
              const actions = (
                <>
                  {message.action === "connect" ? (
                    <Button
                      type="button"
                      className="h-11 gap-2 px-5 text-[13px]"
                      onClick={() => login({ source: "chat" })}
                    >
                      <GoogleGlyph className="size-4" />
                      Continue with Google
                    </Button>
                  ) : null}
                  {message.action === "retry" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={sending}
                      className="rounded-lg bg-muted/25 hover:bg-muted/40"
                      onClick={() => void handleRetry(message.id)}
                    >
                      Try again
                    </Button>
                  ) : null}
                  {message.errorText === COPILOT_CREDIT_MESSAGE && !isProUser ? (
                    <Button
                      type="button"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={UPGRADE_PATH} />}
                    >
                      Upgrade
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
              const hasAction =
                message.action === "connect" ||
                message.action === "retry" ||
                Boolean(message.suggestedPrompts?.length)

              if (message.role === "user") {
                const userReplyTarget = replyTargetFromMessage(message)
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "min-w-0",
                      index === 0 && isMobileOverlay && chatMobileThreadFirstTurnClass,
                      index > 0 && (sameRole ? "mt-3" : isMobileOverlay ? "mt-8" : "mt-7")
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
                      onReply={
                        userReplyTarget
                          ? () => setReplyTarget(userReplyTarget)
                          : undefined
                      }
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
                      index === 0 && isMobileOverlay && chatMobileThreadFirstTurnClass,
                      index > 0 && (sameRole ? "mt-3" : isMobileOverlay ? "mt-8" : "mt-7")
                    )}
                  >
                    <ChatSystemNote variant={isMobileOverlay ? "gemini" : "default"}>
                      <span className="block min-w-0 whitespace-pre-wrap wrap-anywhere">
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
              const assistantReplyTarget = replyTargetFromMessage(message)
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
                    index === 0 && isMobileOverlay && chatMobileThreadFirstTurnClass,
                    index > 0 && (sameRole ? "mt-3" : isMobileOverlay ? "mt-8" : "mt-7")
                  )}
                >
                  <ChatAssistantTurn
                    messageId={message.id}
                    waiting={isWaiting}
                    streaming={isStreamingAssistant && Boolean(message.content)}
                    compact={sameRole}
                    content={showSignalCard ? undefined : message.content}
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
                          feedback={message.feedback}
                          disabled={sending}
                          variant={isMobileOverlay ? "gemini" : "default"}
                          onFeedbackChange={(next) =>
                            setMessageFeedback(message.id, next)
                          }
                          onReply={
                            assistantReplyTarget
                              ? () => setReplyTarget(assistantReplyTarget)
                              : undefined
                          }
                        />
                      ) : undefined
                    }
                  >
                    {signalParts?.leadText ? (
                      <AIMessageRenderer
                        content={signalParts.leadText}
                        className={showSignalCard ? "mb-3" : undefined}
                      />
                    ) : null}
                    {showSignalCard && signalParts?.ticket ? (
                      <ChatSignalCard ticket={signalParts.ticket} />
                    ) : null}
                    {message.noTradeReason ? (
                      <ChatNoTradeCard reason={message.noTradeReason} />
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
              className={cn(isMobileOverlay && chatMobileThreadBottomSpacerClass)}
            />
                </div>
              ) : null}
            </ScrollArea>
            {isMobileOverlay && messages.length > 0 ? (
              <div aria-hidden className={chatMobileThreadBottomFadeClass} />
            ) : null}
            {showScrollDown ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(
                  "absolute bottom-3 left-1/2 z-10 -translate-x-1/2",
                  isMobileOverlay
                    ? chatMobileScrollDownClass
                    : "size-8 rounded-full border-border/70 bg-background/95 shadow-md backdrop-blur-sm hover:bg-background"
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
                "mx-auto w-full shrink-0",
                isMobileOverlay
                  ? "bg-transparent"
                  : "bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/90",
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
                <div className={isMobileOverlay ? "px-3 sm:px-4" : "px-3 sm:px-4"}>
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
                disabled={sending}
                layout={isMobileOverlay ? "floating" : "default"}
                onFloatingFocusChange={
                  isMobileOverlay ? setMobileComposerFocused : undefined
                }
                className={isMobileOverlay ? undefined : "px-3 sm:px-4"}
              />
            </div>
          ) : null}
        </div>
        {!isMobileOverlay ? (
          <ChatNewsSidePanel open={newsOpen} onOpenChange={setNewsOpen} />
        ) : (
          <ChatNewsMobileSheet open={newsOpen} onOpenChange={setNewsOpen} />
        )}
      </div>
      </div>
    </aside>
  )
}

export { ChatAside }
