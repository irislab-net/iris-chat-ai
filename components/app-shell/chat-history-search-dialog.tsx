"use client"

import * as React from "react"
import { MessageSquareIcon, PinIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopSearchDialogClass,
  chatHistoryRailGlassItemActiveClass,
  chatHistoryRailGlassItemClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  NEW_CHAT_TITLE,
  sortConversations,
  type StoredConversation,
} from "@/lib/chat-storage"
import { cn } from "@/lib/utils"

type ChatHistorySearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: StoredConversation[]
  conversationId: string
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
  conversationId,
  onSelect,
  onClose,
}: {
  conversations: StoredConversation[]
  conversationId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const t = useTranslations("workspace")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
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
      className={chatDesktopSearchDialogClass}
      showCloseButton={false}
      onKeyDown={onKeyDown}
    >
      <DialogTitle className="sr-only">{t("searchChats")}</DialogTitle>
      <div className="flex min-w-0 shrink-0 items-center gap-2 border-b border-foreground/6 px-4 py-3 dark:border-white/8">
        <SearchIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          placeholder={t("searchChatsPlaceholder")}
          aria-label={t("searchChats")}
          autoComplete="off"
          className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
        />
        <kbd className="pointer-events-none hidden shrink-0 rounded-md bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block dark:bg-white/8">
          esc
        </kbd>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col px-3 pt-3 pb-3">
        <p className="shrink-0 px-2 pb-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground/75 uppercase">
          {sectionLabel}
        </p>

        <div
          ref={listRef}
          className="min-h-0 max-h-[min(22rem,50vh)] overflow-x-hidden overflow-y-auto"
        >
          {results.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              {t("searchChatsEmpty")}
            </p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-1" role="listbox">
              {results.map((chat, index) => {
                const pinned = Boolean(chat.pinned)
                const title = chatTitle(chat, t("newChat"))
                const active = chat.id === conversationId
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
                      className={cn(
                        chatHistoryRailGlassItemClass,
                        "h-10 w-full min-w-0 justify-start gap-2.5 overflow-hidden rounded-lg px-2.5 text-sm font-normal shadow-none",
                        (active || highlighted) &&
                          chatHistoryRailGlassItemActiveClass
                      )}
                      onClick={() => selectChat(chat.id)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      {pinned ? (
                        <PinIcon className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
                      )}
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
  conversationId,
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
          conversationId={conversationId}
          onSelect={onSelect}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  )
}

export { ChatHistorySearchDialog }
