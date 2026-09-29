"use client"

import * as React from "react"
import { MessageSquareIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopSearchDialogClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  NEW_CHAT_TITLE,
  sortConversations,
  type StoredConversation,
} from "@/lib/chat-storage"

type ChatHistorySearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: StoredConversation[]
  conversationId?: string
  onSelect: (id: string) => void
}

function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase()
}

function chatTitle(chat: StoredConversation, fallback: string) {
  if (!chat.title.trim() || chat.title === NEW_CHAT_TITLE) return fallback
  return chat.title
}

function ChatHistorySearchDialogBody({
  conversations,
  onSelect,
  onClose,
}: {
  conversations: StoredConversation[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const t = useTranslations("workspace")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)

  const sorted = React.useMemo(
    () => sortConversations(conversations),
    [conversations]
  )

  const results = React.useMemo(() => {
    const q = normalizeQuery(query)
    if (!q) return sorted
    return sorted.filter((chat) =>
      normalizeQuery(chatTitle(chat, t("newChat"))).includes(q)
    )
  }, [query, sorted, t])

  const highlightIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1)

  React.useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 10)
    return () => window.clearTimeout(id)
  }, [])

  // Keep the whole panel inside the visible viewport (above the soft keyboard).
  React.useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    function clearMobileFit(el: HTMLElement) {
      el.style.removeProperty("top")
      el.style.removeProperty("max-height")
      el.style.removeProperty("transform")
    }

    function syncToVisualViewport() {
      const el = panelRef.current
      if (!el) return

      if (!window.matchMedia("(max-width: 639px)").matches) {
        clearMobileFit(el)
        return
      }

      const vv = window.visualViewport
      const vvTop = vv?.offsetTop ?? 0
      const vvHeight = vv?.height ?? window.innerHeight
      const pad = 16
      const maxHeight = Math.max(160, Math.round(vvHeight - pad * 2))
      el.style.maxHeight = `${maxHeight}px`
      el.style.transform = "translateX(-50%)"

      // Measure after max-height so we can place the box fully above the keyboard.
      const height = Math.min(
        el.getBoundingClientRect().height || maxHeight,
        maxHeight
      )
      const minTop = vvTop + pad
      const maxTop = vvTop + vvHeight - height - pad
      // Prefer a touch above center, but never spill under the keyboard.
      const preferred = vvTop + vvHeight * 0.36 - height / 2
      const top = Math.min(Math.max(preferred, minTop), Math.max(minTop, maxTop))
      el.style.top = `${Math.round(top)}px`
    }

    syncToVisualViewport()
    const frame = window.requestAnimationFrame(syncToVisualViewport)
    const timers = [50, 150, 350].map((ms) =>
      window.setTimeout(syncToVisualViewport, ms)
    )

    const vv = window.visualViewport
    vv?.addEventListener("resize", syncToVisualViewport)
    vv?.addEventListener("scroll", syncToVisualViewport)
    window.addEventListener("resize", syncToVisualViewport)
    panel.addEventListener("focusin", syncToVisualViewport)

    return () => {
      clearMobileFit(panel)
      window.cancelAnimationFrame(frame)
      for (const id of timers) window.clearTimeout(id)
      vv?.removeEventListener("resize", syncToVisualViewport)
      vv?.removeEventListener("scroll", syncToVisualViewport)
      window.removeEventListener("resize", syncToVisualViewport)
      panel.removeEventListener("focusin", syncToVisualViewport)
    }
  }, [])

  React.useEffect(() => {
    const root = listRef.current
    if (!root) return
    const item = root.querySelector<HTMLElement>(
      `[data-search-index="${highlightIndex}"]`
    )
    item?.scrollIntoView({ block: "nearest" })
  }, [highlightIndex])

  function selectChat(id: string) {
    onSelect(id)
    onClose()
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (results.length === 0) return
      setActiveIndex((i) => {
        const current = Math.min(i, results.length - 1)
        return (current + 1) % results.length
      })
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (results.length === 0) return
      setActiveIndex((i) => {
        const current = Math.min(i, results.length - 1)
        return (current - 1 + results.length) % results.length
      })
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const chat = results[highlightIndex]
      if (chat) selectChat(chat.id)
    }
  }

  const sectionLabel = normalizeQuery(query)
    ? t("searchChatsResults")
    : t("searchChatsRecent")

  return (
    <DialogContent
      ref={panelRef}
      className={cn(chatDesktopSearchDialogClass, "flex!")}
      showCloseButton={false}
      onKeyDown={onKeyDown}
    >
      <DialogTitle className="sr-only">{t("searchChats")}</DialogTitle>
      <div className="flex min-w-0 shrink-0 items-center gap-2 px-4 py-3">
        <InputGroup className="h-10 min-w-0 flex-1 rounded-xl border-0 bg-foreground/6 shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:bg-white/8 dark:has-[[data-slot=input-group-control]:focus-visible]:bg-white/10">
          <InputGroupAddon align="inline-start" className="pl-3">
            <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            placeholder={t("searchChatsPlaceholder")}
            aria-label={t("searchChats")}
            autoComplete="off"
            className="h-10 bg-transparent px-0"
          />
        </InputGroup>
        <kbd className="pointer-events-none hidden shrink-0 rounded-md bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block dark:bg-white/8">
          esc
        </kbd>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pt-3 pb-3">
        <p className="shrink-0 px-2 pb-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground/75 uppercase">
          {sectionLabel}
        </p>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
        >
          {results.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              {t("searchChatsEmpty")}
            </p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-1" role="listbox">
              {results.map((chat, index) => {
                const title = chatTitle(chat, t("newChat"))
                const highlighted = index === highlightIndex
                return (
                  <li
                    key={chat.id}
                    role="option"
                    aria-selected={highlighted}
                    className="min-w-0"
                    data-search-index={index}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-full min-w-0 justify-start gap-2.5 overflow-hidden rounded-lg border-0 bg-transparent px-2.5 text-sm font-normal text-foreground shadow-none hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                      onClick={() => selectChat(chat.id)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-start">
                        {title}
                      </span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </DialogContent>
  )
}

function ChatHistorySearchDialog({
  open,
  onOpenChange,
  conversations,
  onSelect,
}: ChatHistorySearchDialogProps) {
  const [session, setSession] = React.useState(0)

  function handleOpenChange(next: boolean) {
    if (next) setSession((value) => value + 1)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {open ? (
        <ChatHistorySearchDialogBody
          key={session}
          conversations={conversations}
          onSelect={onSelect}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  )
}

export { ChatHistorySearchDialog }
