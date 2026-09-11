"use client"

import * as React from "react"
import Image from "next/image"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  ChevronDownIcon,
  HistoryIcon,
  Maximize2Icon,
  MessageSquarePlusIcon,
} from "lucide-react"

import { ChatAccountFooter } from "@/components/app-shell/chat-account-footer"
import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import { ChatMobileGeminiLogo } from "@/components/app-shell/chat-mobile-gemini-logo"
import { chatMobileScrollDownClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatMobileHeader } from "@/components/app-shell/chat-mobile-header"
import {
  ChatHistoryRail,
  ChatHistorySidebar,
} from "@/components/app-shell/chat-history-sidebar"
import { ChatComposer } from "@/components/app-shell/chat-composer"
import { ChatMessageActions } from "@/components/app-shell/chat-message-actions"
import {
  ChatAssistantTurn,
  ChatSystemNote,
  IrisMark,
} from "@/components/app-shell/chat-message"
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
import { useIsDesktop } from "@/hooks/use-media-query"
import { useShellSidebarLayout } from "@/hooks/use-shell-sidebar-layout"
import { useChatClientContext, useDeskContextSnapshot } from "@/hooks/use-chat-client-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  createChatClientActionHandlers,
  executeChatClientActions,
} from "@/lib/api/chat"
import {
  dispatchCopilotGhostTrade,
  dispatchDockChat,
  subscribeCopilotChatPrefill,
} from "@/lib/paper-trading/copilot-client"
import { submitChatMessageFeedback } from "@/lib/api/chat-feedback"
import { streamCoPilotChat } from "@/lib/api/co-pilot"
import { getStoredAccessToken } from "@/lib/api/auth"
import {
  refreshSessionInStore,
  syncChatHistoryFromServer,
} from "@/lib/chat-history-sync"
import { displayPlanName } from "@/lib/billing/catalog"
import { isAppDeskPath, UPGRADE_PATH } from "@/lib/site"
import {
  WORKSPACE_TAB_NEWS,
  workspaceTabHref,
} from "@/lib/workspace-tab"
import { resolveUserDisplayName } from "@/lib/user-profile"
import type { CoPilotHistoryMessage, TrialInfo } from "@/lib/api/types"
import {
  trackChatMessageBlockedGuest,
  trackChatMessageSent,
} from "@/lib/analytics"
import { isGuestChatSession } from "@/lib/chat-auth-session"
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
import { requestOpenPaperTrading } from "@/lib/paper-trading/open-request"
import { SESSION_RESET_EVENT } from "@/lib/session-reset"
import type { ChatDisplayMode } from "@/lib/shell-layout-prefs"
import { SHELL_SIDEBAR_COMPACT_FALLBACK } from "@/lib/shell-sidebar-layout"
import { resolvePaperTicketFromChatTurn } from "@/lib/chat/parse-trade-setup"
import { isPaperTradeIntent } from "@/lib/iris-paper-trade/intent"
import { IRIS_SAMPLE_PROMPTS } from "@/lib/iris-paper-trade/types"
import { cn } from "@/lib/utils"

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

async function streamCoPilotChatWithAuthRetry(
  input: Parameters<typeof streamCoPilotChat>[0],
  handlers: Parameters<typeof streamCoPilotChat>[1],
  refreshSession: () => Promise<void>
) {
  try {
    return await streamCoPilotChat(input, handlers)
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    const code = (error as { code?: string } | null)?.code
    if (status === 403 && code === "login_required") throw error
    if (status !== 401) throw error
    if (isGuestChatSession()) {
      await ensureGuestSession()
    } else if (getStoredAccessToken()) {
      await refreshSession()
      if (!getStoredAccessToken()) throw error
    } else {
      await ensureGuestSession()
    }
    return await streamCoPilotChat(input, handlers)
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

function IrisSamplePrompts({
  disabled,
  onEdit,
}: {
  disabled?: boolean
  onEdit: (text: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        Starters
      </p>
      {IRIS_SAMPLE_PROMPTS.map((prompt) => (
        <Button
          key={prompt.title}
          type="button"
          variant="ghost"
          disabled={disabled}
          aria-label={`Use prompt: ${prompt.title}`}
          className="h-auto w-full items-stretch justify-start rounded-xl bg-muted/20 px-3 py-2.5 text-left whitespace-normal shadow-none transition-colors hover:bg-muted/35 active:scale-[0.99]"
          onPointerEnter={() => {
            void import("@/lib/chat/parse-trade-setup")
            void import("@/components/paper-trading/paper-trading-workspace")
          }}
          onClick={() => onEdit(prompt.text)}
        >
          <span className="flex w-full flex-col items-start gap-1 whitespace-normal">
            <span className="text-[13px] font-medium text-foreground">
              {prompt.title}
            </span>
            <span className="line-clamp-2 text-[11px] leading-5 text-muted-foreground">
              {prompt.text}
            </span>
          </span>
        </Button>
      ))}
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
    user,
  } = useAuth()
  const showDeskSkeleton =
    waitForDesk &&
    displayMode === "docked" &&
    !authLoading &&
    !ticketSlot?.occupied &&
    !deskWaitTimedOut
  const chatClientContext = useChatClientContext({ user, isProUser })
  const deskContext = useDeskContextSnapshot()
  const chatClientActions = React.useMemo(
    () =>
      createChatClientActionHandlers({
        navigate: (href) => router.push(href),
        resolvePosition: (input) => {
          const positions = deskContext?.openPositions ?? []
          if (input.positionId) {
            const match = positions.find((p) => p.id === input.positionId)
            if (!match) return null
            return {
              id: match.id,
              symbol: match.symbol,
              side: match.side,
              entryPrice: match.entryPrice,
              quantity: match.quantity,
            }
          }
          const key = input.symbol?.trim().toUpperCase()
          if (!key) return null
          const match = positions.find((p) => p.symbol === key)
          if (!match) return null
          return {
            id: match.id,
            symbol: match.symbol,
            side: match.side,
            entryPrice: match.entryPrice,
            quantity: match.quantity,
          }
        },
      }),
    [router, deskContext]
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
  const focusComposerOnDesktop = React.useCallback(() => {
    if (isDesktop !== true) return
    queueMicrotask(() => {
      const el = composerRef.current
      if (!el) return
      try {
        el.focus({ preventScroll: true })
      } catch {
        el.focus()
      }
    })
  }, [isDesktop])
  const [draft, setDraft] = React.useState("")
  const [effort, setEffort] = React.useState<ChatEffort>(DEFAULT_CHAT_EFFORT)
  React.useEffect(() => {
    setEffort(readChatEffort())
  }, [])
  const abortRef = React.useRef<AbortController | null>(null)
  const persistTimer = React.useRef(0)
  const historySyncRef = React.useRef(0)
  const [session, setSession] = React.useState<string>("pending")
  const [guestTrial, setGuestTrial] = React.useState<TrialInfo | null>(null)
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
  }, [authLoading, isAuthenticated])

  const guestTrialExhausted =
    !isAuthenticated && (guestTrial?.messages_remaining ?? 1) <= 0

  const applyStoredConversation = React.useCallback(
    (conversation: StoredConversation) => {
      setConversationId(conversation.id)
      setMessages(restoreMessages(conversation.messages, conversation.history))
      setHistory(conversation.history)
    },
    []
  )

  const refreshConversationFromServer = React.useCallback(
    async (sessionId: string) => {
      if (!chatOwnerId || sending) return
      try {
        const store = await refreshSessionInStore(chatOwnerId, sessionId)
        setConversations(store.conversations)
        const updated = store.conversations.find((c) => c.id === sessionId)
        if (!updated) return
        setConversationId((currentId) => {
          if (currentId !== sessionId) return currentId
          setMessages(restoreMessages(updated.messages, updated.history))
          setHistory(updated.history)
          return currentId
        })
      } catch {
        // Keep local copy when the server is unavailable.
      }
    },
    [chatOwnerId, sending]
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
      }

      store = upsertConversation(store, saved)
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
      const active =
        store.conversations.find((c) => c.id === store.activeId) ??
        store.conversations[0]
      if (active) {
        setConversationId(active.id)
        const restored = restoreMessages(active.messages, active.history)
        setMessages(restored)
        setHistory(active.history)
      } else {
        setConversationId(crypto.randomUUID())
        setMessages([])
        setHistory([])
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
        const store = await syncChatHistoryFromServer(chatOwnerId)
        if (cancelled || syncId !== historySyncRef.current) return
        setConversations(store.conversations)
        const active =
          store.conversations.find((c) => c.id === store.activeId) ??
          store.conversations[0]
        if (active) applyStoredConversation(active)
      } catch {
        // Offline or unauthenticated copilot — local history still works.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    applyStoredConversation,
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
    return subscribeCopilotChatPrefill((input) => {
      setDraft(input.text)
      if (input.focus !== false) {
        focusComposerOnDesktop()
      }
    })
  }, [focusComposerOnDesktop])

  React.useEffect(() => {
    function onSessionReset() {
      window.clearTimeout(persistTimer.current)
      abortRef.current?.abort()
      abortRef.current = null
      setSending(false)
      setPendingAssistantId(null)
      setHistoryOpen(false)
      setDraft("")
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
      const next = update(prev)
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

    const target = conversations.find((c) => c.id === id)
    if (!target) return

    applyStoredConversation(target)
    setDraft("")
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
      const next = store.conversations[0]
      if (next) {
        setConversationId(next.id)
        const restored = restoreMessages(next.messages, next.history)
        setMessages(restored)
        setHistory(next.history)
      } else {
        const blank = blankConversation()
        setConversationId(blank.id)
        setMessages(blank.messages)
        setHistory(blank.history)
      }
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
  }) {
    const { userMessage, historySnapshot, assistantId, activeId } = input

    setSending(true)
    setPendingAssistantId(assistantId)
    window.clearTimeout(persistTimer.current)

    const controller = new AbortController()
    abortRef.current = controller
    let partialContent = ""

    if (isPaperTradeIntent(userMessage)) {
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
          result.status === "proposed"
            ? result.ticket
            : resolvePaperTicketFromChatTurn({
                userMessage,
                assistantMessage: fullText,
              })
        const finalHistory: CoPilotHistoryMessage[] = [
          ...historySnapshot,
          { role: "user", content: userMessage },
          { role: "assistant", content: fullText },
        ]
        setHistory(finalHistory)
        setPendingAssistantId(null)
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
                    pendingBracket: undefined,
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
        if (parsedTicket) {
          dispatchCopilotGhostTrade({
            id: `iris:${parsedTicket.symbol}:${Date.now()}`,
            symbol: parsedTicket.symbol,
            side: parsedTicket.side,
            entryPrice: parsedTicket.markPrice,
            quantity: parsedTicket.quantity,
            stopLoss: parsedTicket.stopLoss,
            takeProfit: parsedTicket.takeProfit,
            label: "IRIS proposal",
            clearPrevious: true,
          })
        }
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
                  errorText: coPilotUserFacingError(error),
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
      const result = await streamCoPilotChatWithAuthRetry(
        {
          message: userMessage,
          conversationId: activeId,
          history: historySnapshot,
          effort,
          clientContext: chatClientContext,
        },
        {
          signal: controller.signal,
          onMeta: (meta) => {
            if (meta.conversation_id && meta.conversation_id !== activeId) {
              setConversationId(meta.conversation_id)
            }
          },
        },
        refresh
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

      const fullText = (result.message || "").trim()
      if (!fullText) {
        throw new Error("IRIS returned an empty reply. Please try again.")
      }

      const finalHistory: CoPilotHistoryMessage[] = [
        ...historySnapshot,
        { role: "user", content: userMessage },
        { role: "assistant", content: fullText },
      ]
      setHistory(finalHistory)

      setPendingAssistantId(null)

      const finalizeSuccess = (
        text: string,
        suggestedPrompts?: string[],
        extras?: Pick<
          ChatUiMessage,
          "clientActionSummaries" | "pendingBracket" | "paperTicket" | "action"
        >
      ) => {
        setMessagesAndPersist(
          (prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: text,
                    error: false,
                    action: extras?.action,
                    paperTicket: extras?.paperTicket,
                    pendingBracket: extras?.pendingBracket,
                    clientActionSummaries: extras?.clientActionSummaries,
                    retryUserMessage: undefined,
                    suggestedPrompts,
                  }
                : m
            ),
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
        clientResult: ReturnType<typeof executeChatClientActions>
      ): Pick<
        ChatUiMessage,
        "clientActionSummaries" | "pendingBracket" | "paperTicket" | "action"
      > => {
        const parsedTicket = resolvePaperTicketFromChatTurn({
          userMessage,
          assistantMessage: fullText,
        })
        const hasGhostAction = clientResult.summaries.some(
          (item) => item.tool === "preview_ghost_trade" && item.applied
        )

        if (parsedTicket && !hasGhostAction) {
          dispatchCopilotGhostTrade({
            id: `chat:${parsedTicket.symbol}:${Date.now()}`,
            symbol: parsedTicket.symbol,
            side: parsedTicket.side,
            entryPrice: parsedTicket.markPrice,
            quantity: parsedTicket.quantity,
            stopLoss: parsedTicket.stopLoss,
            takeProfit: parsedTicket.takeProfit,
            label: "IRIS setup",
            clearPrevious: true,
          })
        }

        if (parsedTicket) {
          return {
            clientActionSummaries: clientResult.summaries,
            pendingBracket: clientResult.pendingBracket,
            paperTicket: parsedTicket,
          }
        }

        return {
          clientActionSummaries: clientResult.summaries,
          pendingBracket: clientResult.pendingBracket,
        }
      }

      // Skip typewriter when stream already painted content via onDelta.
      if (partialContent.trim()) {
        const clientResult = executeChatClientActions(
          result.clientActions,
          chatClientActions
        )
        finalizeSuccess(
          fullText,
          result.suggestedPrompts,
          buildTurnExtras(clientResult)
        )
      } else {
        await typewriterReveal(
          fullText,
          (partial) => {
            partialContent = partial
            setMessages((prev) =>
              prev.map((m) =>
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
            )
          },
          controller.signal
        )

        if (controller.signal.aborted) {
          setMessages((prev) => removeEmptyAssistantTurn(prev, assistantId))
          return
        }

        const clientResult = executeChatClientActions(
          result.clientActions,
          chatClientActions
        )
        finalizeSuccess(
          fullText,
          result.suggestedPrompts,
          buildTurnExtras(clientResult)
        )
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
                  errorText: coPilotUserFacingError(error),
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
    const historySnapshot = history
    const activeId = conversationId

    const withUser: ChatUiMessage[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", content: userMessage },
      { id: assistantId, role: "assistant", content: "" },
    ]
    setMessages(withUser)

    await runAssistantRequest({
      userMessage,
      historySnapshot,
      assistantId,
      activeId,
    })
  }

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

    // History for retry = API history before this failed turn (do not include partial).
    // Current `history` state was not advanced on failure — safe to reuse.
    const historySnapshot = history
    const activeId = conversationId
    setMessages(prepareMessagesForRetry(messages, assistantId))

    await runAssistantRequest({
      userMessage,
      historySnapshot,
      assistantId,
      activeId,
    })
  }

  const showDesktopLayoutControls =
    isDesktop === true && !onClose && Boolean(onDisplayModeChange)

  const isFocusedLayout = displayMode === "focused" && !onClose
  const isMobileOverlay = Boolean(onClose)
  const canEmbedHistoryRail = isAuthenticated && isFocusedLayout
  const historyRailVisible = canEmbedHistoryRail
  const showFocusedMainHeader = isFocusedLayout && !isAuthenticated
  const showMainHeader = showFocusedMainHeader || !isFocusedLayout
  const showMobileHistoryOverlay = isMobileOverlay && historyOpen
  const showHistoryPanel =
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
    showThread && threadHasUserMessages && showMainHeader
  const showStandaloneThreadToolbar =
    showThread && threadHasUserMessages && !showMainHeader
  const threadTitle =
    activeConversation?.title ??
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
      setShowScrollDown(!nearBottom && messages.length > 0)
    }

    syncScrollDown()
    viewport.addEventListener("scroll", syncScrollDown, { passive: true })

    const content = viewport.firstElementChild
    const resizeObserver =
      content && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncScrollDown)
        : null
    if (content && resizeObserver) resizeObserver.observe(content)

    return () => {
      viewport.removeEventListener("scroll", syncScrollDown)
      resizeObserver?.disconnect()
    }
  }, [messages, showThread, conversationId])

  async function shareCurrentConversation() {
    const text = formatConversationTranscript(messages)
    if (!text.trim()) return
    await navigator.clipboard.writeText(text)
  }

  function deleteCurrentConversation() {
    removeConversation(conversationId)
  }

  function openNewsFromChat() {
    setHistoryOpen(false)
    onClose?.()
    dispatchDockChat()
    router.replace(workspaceTabHref(WORKSPACE_TAB_NEWS), { scroll: false })
  }

  const mobileGreetingName = resolveUserDisplayName(user)
  const mobileGreeting = mobileGreetingName
    ? t("mobileGreeting", { name: mobileGreetingName.split(/\s+/)[0] ?? mobileGreetingName })
    : t("mobileGreetingGuest")
  const [mobileComposerFocused, setMobileComposerFocused] = React.useState(false)
  const [mobileIntroGlow, setMobileIntroGlow] = React.useState(true)

  React.useEffect(() => {
    if (!isMobileOverlay) return
    setMobileIntroGlow(true)
    const id = window.setTimeout(() => setMobileIntroGlow(false), 1400)
    return () => window.clearTimeout(id)
  }, [isMobileOverlay, conversationId])

  React.useEffect(() => {
    if (displayMode === "focused" && isAuthenticated) {
      setHistoryOpen(true)
    }
  }, [displayMode, isAuthenticated])

  if (showDeskSkeleton) {
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
          ? "flex-col bg-white text-foreground dark:bg-background"
          : isFocusedLayout
            ? "flex-row bg-sidebar text-sidebar-foreground"
            : "flex-col bg-sidebar text-sidebar-foreground",
        displayMode === "docked" && !isMobileOverlay ? "rounded-r-2xl" : "rounded-none",
        className
      )}
    >
      {isMobileOverlay ? (
        <ChatMobileGeminiBackground
          active={mobileComposerFocused}
          loading={sending}
          intro={mobileIntroGlow}
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
          footer={<ChatAccountFooter />}
          onDock={
            showDesktopLayoutControls
              ? () => onDisplayModeChange?.("docked")
              : undefined
          }
          onOpenNews={openNewsFromChat}
        />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          isMobileOverlay
            ? "bg-transparent text-foreground"
            : "bg-sidebar text-sidebar-foreground"
        )}
      >
      {isMobileOverlay ? (
        <ChatMobileHeader
          historyOpen={historyOpen}
          onOpenHistory={() => setHistoryOpen((open) => !open)}
          effort={effort}
          onEffortChange={onEffortChange}
          hideEffort={!isAuthenticated}
          onNewChat={startNewChat}
          onOpenNews={openNewsFromChat}
          sending={sending}
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
            onOpenNews={() => {
              setHistoryOpen(false)
              openNewsFromChat()
            }}
            showBrandHeader={false}
            className="min-h-0 flex-1"
          />
        </div>
      ) : null}
      {!isMobileOverlay && (showFocusedMainHeader || !isFocusedLayout) ? (
      <header
        className={cn(
          "flex min-h-12 shrink-0 items-center gap-1 px-2 sm:gap-2 sm:px-3",
          onClose && "pt-[var(--app-safe-top,0px)]"
        )}
      >
        <Link
          href="/"
          aria-label={common("brand")}
          className="shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Image
            src="/Logo.png"
            alt=""
            width={32}
            height={32}
            className="block size-7 shrink-0 rounded-md"
            priority
          />
        </Link>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-none tracking-tight">
            IRIS
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {isAuthenticated
              ? displayPlanName(user?.tier)
              : guestUnavailable
                ? t("copilotGuestUnavailable")
                : guestTrial
                  ? formatGuestTrialLabel(guestTrial)
                  : t("copilotGuestTry")}
          </span>
        </div>
        {showThreadToolbarInHeader && !isMobileOverlay && !isProUser ? (
          <ChatThreadUpgradeButton />
        ) : !showThreadToolbarInHeader && !isMobileOverlay && !isProUser ? (
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
        {showDesktopLayoutControls && !isFocusedLayout ? (
          <ChatHeaderIconButton
            label={t("fullScreenChat")}
            onClick={() => onDisplayModeChange?.("focused")}
          >
            <Maximize2Icon />
          </ChatHeaderIconButton>
        ) : null}
        {isAuthenticated && !isFocusedLayout ? (
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
            <MessageSquarePlusIcon />
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showStandaloneThreadToolbar ? (
            <ChatThreadToolbar
              title={threadTitle}
              pinned={Boolean(activeConversation?.pinned)}
              disabled={sending}
              showUpgrade={!isMobileOverlay && !isProUser}
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
              className="h-full min-h-0"
            >
              {messages.length === 0 ? (
                <div
                  className={cn(
                    "flex min-h-full flex-col px-4 py-10",
                    isMobileOverlay
                      ? "items-center justify-center text-center"
                      : "justify-center"
                  )}
                >
                  <div
                    className={cn(
                      "mx-auto w-full",
                      CHAT_CONTENT_MAX_WIDTH
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-col items-center text-center",
                        isMobileOverlay ? "gap-5" : "mb-5"
                      )}
                    >
                      {isMobileOverlay ? (
                        <ChatMobileGeminiLogo />
                      ) : (
                        <IrisMark className="size-10 rounded-xl" />
                      )}
                      <h2
                        className={cn(
                          "font-normal tracking-tight text-foreground",
                          isMobileOverlay
                            ? "max-w-[20rem] text-[1.75rem] leading-tight text-[#1f1f1f] dark:text-foreground"
                            : "mt-3 text-[15px] font-semibold"
                        )}
                      >
                        {isMobileOverlay
                          ? mobileGreeting
                          : "How can I help?"}
                      </h2>
                      {!isMobileOverlay ? (
                        <p className="mt-1.5 max-w-[16rem] text-[12px] leading-5 text-muted-foreground">
                          {isAuthenticated
                            ? t("emptySignedIn")
                            : guestUnavailable
                              ? t("emptyGuestUnavailable")
                              : t("emptyGuestTrial")}
                        </p>
                      ) : null}
                    </div>
                    {!isMobileOverlay ? (
                      <IrisSamplePrompts
                        disabled={sending}
                        onEdit={(text) => {
                          setDraft(text)
                          focusComposerOnDesktop()
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "mx-auto flex w-full min-w-0 flex-col px-4 py-4",
                    CHAT_CONTENT_MAX_WIDTH
                  )}
                >
            {messages.map((message, index) => {
              const prev = messages[index - 1]
              const sameRole = prev?.role === message.role
              const isWaiting =
                message.id === pendingAssistantId &&
                message.role === "assistant" &&
                !message.content &&
                !message.error
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
                  {message.errorText === COPILOT_CREDIT_MESSAGE ? (
                    <Button
                      type="button"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={UPGRADE_PATH} />}
                    >
                      Upgrade
                    </Button>
                  ) : null}
                  {message.action === "view_paper_trade" ? (
                    <Button
                      type="button"
                      size="sm"
                      onPointerEnter={() => {
                        void import("@/components/paper-trading/paper-trading-workspace")
                      }}
                      onClick={() => requestOpenPaperTrading()}
                    >
                      View Paper Trade
                    </Button>
                  ) : null}
                  {message.suggestedPrompts?.length ? (
                    <IrisFollowUpPrompts
                      prompts={message.suggestedPrompts}
                      disabled={sending}
                      onSelect={(text) => {
                        setDraft(text)
                        focusComposerOnDesktop()
                      }}
                    />
                  ) : null}
                </>
              )
              const hasAction =
                message.action === "connect" ||
                message.action === "retry" ||
                message.action === "view_paper_trade" ||
                Boolean(message.suggestedPrompts?.length)

              if (message.role === "user") {
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "min-w-0",
                      index > 0 && (sameRole ? "mt-2" : "mt-7")
                    )}
                  >
                    <ChatUserTurn
                      messageId={message.id}
                      conversationId={conversationId}
                      content={message.content}
                      disabled={sending}
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
                      index > 0 && (sameRole ? "mt-2" : "mt-7")
                    )}
                  >
                    <ChatSystemNote>
                      <span className="block min-w-0 whitespace-pre-wrap wrap-anywhere">
                        {message.content}
                      </span>
                      {errorNote}
                    </ChatSystemNote>
                  </div>
                )
              }
              const showMessageActions =
                !isWaiting &&
                Boolean(message.content?.trim()) &&
                message.action !== "connect"

              return (
                <div
                  key={message.id}
                  className={cn(
                    "group/turn min-w-0",
                    index > 0 && (sameRole ? "mt-2" : "mt-7")
                  )}
                >
                  <ChatAssistantTurn
                    waiting={isWaiting}
                    compact={sameRole}
                    content={message.content}
                    actions={hasAction ? actions : undefined}
                    toolbar={
                      showMessageActions ? (
                        <ChatMessageActions
                          messageId={message.id}
                          conversationId={conversationId}
                          content={message.content}
                          feedback={message.feedback}
                          disabled={sending}
                          onFeedbackChange={(next) =>
                            setMessageFeedback(message.id, next)
                          }
                        />
                      ) : undefined
                    }
                  >
                    {errorNote}
                  </ChatAssistantTurn>
                </div>
              )
            })}
            <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>
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
                  : "border-t border-border/50 bg-sidebar/95 backdrop-blur-md supports-[backdrop-filter]:bg-sidebar/90",
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
              <ChatComposer
                value={draft}
                onValueChange={(next) => {
                  setDraft(next)
                  if (guestSendError) setGuestSendError(null)
                }}
                textareaRef={composerRef}
                effort={effort}
                onEffortChange={onEffortChange}
                hideEffort={!isAuthenticated}
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
      </div>
    </aside>
  )
}

export { ChatAside }
