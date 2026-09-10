"use client"

import * as React from "react"
import {
  MessageSquareIcon,
  Minimize2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ChatDeskToolsBanner } from "@/components/app-shell/chat-desk-tools-banner"
import { ChatRenameDialog } from "@/components/app-shell/chat-rename-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  sortConversations,
  type StoredConversation,
} from "@/lib/chat-storage"
import { cn } from "@/lib/utils"

const headerIconClass =
  "size-8 text-muted-foreground hover:bg-muted hover:text-foreground [&_svg:not([class*='size-'])]:size-4"

const rowMenuButtonClass =
  "size-7 shrink-0 text-muted-foreground hover:bg-background/80 hover:text-foreground opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/item:opacity-100 [@media(hover:hover)]:group-focus-within/item:opacity-100"

type ChatHistorySidebarProps = {
  conversations: StoredConversation[]
  conversationId: string
  sending: boolean
  onSelect: (id: string) => void
  onDelete: (id: string, event: React.MouseEvent) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
  onNewChat?: () => void
  onDock?: () => void
  footer?: React.ReactNode
  showBrandHeader?: boolean
  className?: string
}

function ChatHistorySidebar({
  conversations,
  conversationId,
  sending,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  onNewChat,
  onDock,
  footer,
  showBrandHeader = true,
  className,
}: ChatHistorySidebarProps) {
  const t = useTranslations("workspace")
  const [renameTarget, setRenameTarget] =
    React.useState<StoredConversation | null>(null)
  const [renameDraft, setRenameDraft] = React.useState("")

  const sorted = React.useMemo(
    () => sortConversations(conversations),
    [conversations]
  )
  const pinned = sorted.filter((chat) => chat.pinned)
  const recent = sorted.filter((chat) => !chat.pinned)

  function openRename(chat: StoredConversation) {
    setRenameTarget(chat)
    setRenameDraft(chat.title)
  }

  function closeRename() {
    setRenameTarget(null)
    setRenameDraft("")
  }

  function submitRename() {
    if (!renameTarget) return
    const next = renameDraft.trim()
    if (!next) return
    onRename(renameTarget.id, next)
    closeRename()
  }

  return (
    <>
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        {showBrandHeader ? (
          <header className="flex shrink-0 items-center gap-1 px-2 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
              <Image
                src="/Logo.png"
                alt=""
                width={28}
                height={28}
                className="block size-7 shrink-0 rounded-md"
              />
              <span className="min-w-0 truncate text-sm font-semibold tracking-tight">
                IRIS
              </span>
            </div>
            {onDock ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={headerIconClass}
                aria-label={t("dockChat")}
                title={t("dockChat")}
                onClick={onDock}
              >
                <Minimize2Icon />
              </Button>
            ) : null}
          </header>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col px-2 pb-2">
            {onNewChat ? (
              <Button
                type="button"
                variant="ghost"
                disabled={sending}
                className="h-9 w-full justify-start gap-3 rounded-lg px-3 text-sm font-normal shadow-none hover:bg-muted/50"
                onClick={onNewChat}
              >
                <SquarePenIcon className="size-4 shrink-0 text-muted-foreground" />
                {t("newChat")}
              </Button>
            ) : null}

            {conversations.length === 0 ? (
              <Empty className="mx-1 mt-4 border-0 p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquareIcon />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">{t("noSavedChats")}</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    {t("emptySignedIn")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {pinned.length > 0 ? (
                  <ConversationSection
                    label={t("pinnedChats")}
                    chats={pinned}
                    conversationId={conversationId}
                    sending={sending}
                    onSelect={onSelect}
                    onRename={openRename}
                    onTogglePin={onTogglePin}
                    onDelete={onDelete}
                  />
                ) : null}

                {pinned.length > 0 && recent.length > 0 ? (
                  <Separator className="mx-2 my-2" />
                ) : null}

                <ConversationSection
                  label={t("recentChats")}
                  chats={recent}
                  conversationId={conversationId}
                  sending={sending}
                  onSelect={onSelect}
                  onRename={openRename}
                  onTogglePin={onTogglePin}
                  onDelete={onDelete}
                  className={pinned.length > 0 ? "pt-0" : undefined}
                />
              </>
            )}
          </div>
        </ScrollArea>

        {onDock ? <ChatDeskToolsBanner onDock={onDock} /> : null}

        {footer}
      </div>

      <ChatRenameDialog
        open={renameTarget != null}
        value={renameDraft}
        onValueChange={setRenameDraft}
        onOpenChange={(open) => {
          if (!open) closeRename()
        }}
        onSubmit={submitRename}
      />
    </>
  )
}

function ConversationSection({
  label,
  chats,
  conversationId,
  sending,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
  className,
}: {
  label: string
  chats: StoredConversation[]
  conversationId: string
  sending: boolean
  onSelect: (id: string) => void
  onRename: (chat: StoredConversation) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string, event: React.MouseEvent) => void
  className?: string
}) {
  if (chats.length === 0) return null

  return (
    <section className={cn("pt-4", className)}>
      <p className="px-3 pb-1.5 text-xs text-muted-foreground">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {chats.map((chat) => (
          <li key={chat.id}>
            <ConversationRow
              chat={chat}
              active={chat.id === conversationId}
              sending={sending}
              onSelect={() => onSelect(chat.id)}
              onRename={() => onRename(chat)}
              onTogglePin={() => onTogglePin(chat.id)}
              onDelete={(event) => onDelete(chat.id, event)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ConversationRow({
  chat,
  active,
  sending,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}: {
  chat: StoredConversation
  active: boolean
  sending: boolean
  onSelect: () => void
  onRename: () => void
  onTogglePin: () => void
  onDelete: (event: React.MouseEvent) => void
}) {
  const t = useTranslations("workspace")
  const pinned = Boolean(chat.pinned)

  const row = (
    <div
      className={cn(
        "group/item relative flex min-w-0 items-center gap-1 rounded-lg px-1 py-0.5 transition-colors",
        active ? "bg-muted" : "hover:bg-muted/50"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-9 min-w-0 flex-1 justify-start gap-2.5 rounded-md px-2 text-left font-normal shadow-none hover:bg-transparent"
        onClick={onSelect}
      >
        {pinned ? (
          <PinIcon className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm">{chat.title}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(rowMenuButtonClass, active && "[@media(hover:hover)]:opacity-100")}
              aria-label={t("chatOptions")}
              disabled={sending}
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem className="gap-2" onClick={onRename}>
            <PencilIcon />
            {t("renameChat")}
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={onTogglePin}>
            {pinned ? <PinOffIcon /> : <PinIcon />}
            {pinned ? t("unpinChat") : t("pinChat")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="gap-2"
            onClick={onDelete}
          >
            <Trash2Icon />
            {t("deleteChat")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger render={row} />
      <ContextMenuContent className="min-w-44">
        <ContextMenuItem className="gap-2" onClick={onRename}>
          <PencilIcon />
          {t("renameChat")}
        </ContextMenuItem>
        <ContextMenuItem className="gap-2" onClick={onTogglePin}>
          {pinned ? <PinOffIcon /> : <PinIcon />}
          {pinned ? t("unpinChat") : t("pinChat")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          className="gap-2"
          onClick={onDelete}
        >
          <Trash2Icon />
          {t("deleteChat")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ChatHistoryRail({
  conversations,
  conversationId,
  sending,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  onNewChat,
  onDock,
  footer,
  sidebarWidth,
  className,
}: ChatHistorySidebarProps & {
  sidebarWidth: string
}) {
  const t = useTranslations("workspace")
  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-sidebar text-sidebar-foreground",
        className
      )}
      style={{ width: sidebarWidth }}
      data-tour="chat-history-rail"
      aria-label={t("chatHistory")}
    >
      <ChatHistorySidebar
        conversations={conversations}
        conversationId={conversationId}
        sending={sending}
        onSelect={onSelect}
        onDelete={onDelete}
        onRename={onRename}
        onTogglePin={onTogglePin}
        onNewChat={onNewChat}
        onDock={onDock}
        footer={footer}
        className="min-h-0 flex-1"
      />
    </aside>
  )
}

export { ChatHistoryRail, ChatHistorySidebar }
