"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  EclipseIcon,
  LogOutIcon,
  MessageSquareIcon,
  Minimize2Icon,
  MoreHorizontalIcon,
  NewspaperIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Settings,
  SquarePenIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { UPGRADE_PATH } from "@/lib/site"
import {
  userAccountLabel,
  userAvatarFallback,
} from "@/lib/user-profile"
import { cn } from "@/lib/utils"

const headerIconClass =
  "size-8 text-muted-foreground hover:bg-muted hover:text-foreground [&_svg:not([class*='size-'])]:size-4"

const rowMenuButtonClass =
  "size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/item:opacity-100 [@media(hover:hover)]:group-focus-within/item:opacity-100"

const chatOptionsMenuClass =
  "min-w-[12.5rem] rounded-2xl border border-border/40 bg-popover/95 p-1.5 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.28)] ring-0 backdrop-blur-xl dark:border-border/50"

const chatOptionsItemClass =
  "min-h-10 gap-3 rounded-xl px-3 py-2.5 text-[15px] font-normal focus:bg-muted/70"

const chatOptionsIconClass = "size-[18px] shrink-0 text-muted-foreground"

const chatOptionsDeleteClass =
  "min-h-10 gap-3 rounded-xl px-3 py-2.5 text-[15px] font-normal text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive!"

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
  onClose?: () => void
  onOpenNews?: () => void
  footer?: React.ReactNode
  showBrandHeader?: boolean
  variant?: "panel" | "mobile-drawer"
  className?: string
}

function MobileHistoryDrawerFooter({
  onOpenNews,
}: {
  onOpenNews?: () => void
}) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const { user, isProUser, login, logout, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-border/40 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      {user ? (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar className="size-9 after:border-0">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={userAccountLabel(user)} />
            ) : null}
            <AvatarFallback className="text-[11px] font-medium">
              {userAvatarFallback(user)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-sm font-medium">
            {userAccountLabel(user)}
          </span>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 flex-1 justify-start gap-2 px-1"
          disabled={loginPending}
          onClick={() => login({ source: "chat" })}
        >
          <Avatar className="size-8 after:border-0">
            <AvatarFallback className="bg-muted text-[11px]">
              <GoogleGlyph className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          {loginPending ? t("connecting") : t("signIn")}
        </Button>
      )}
      {!isProUser ? (
        <Button
          size="sm"
          className="h-9 shrink-0 rounded-full px-4 text-sm font-medium"
          nativeButton={false}
          render={<Link href={UPGRADE_PATH} />}
        >
          {t("upgrade")}
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              aria-label={common("settings")}
            />
          }
        >
          <Settings className="size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-48">
          {onOpenNews ? (
            <DropdownMenuItem className="gap-2" onClick={onOpenNews}>
              <NewspaperIcon className="size-4" />
              {t("news")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className="gap-2"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <EclipseIcon className="size-4" />
            {resolvedTheme === "dark" ? common("lightMode") : common("darkMode")}
          </DropdownMenuItem>
          {user ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="gap-2"
                onClick={() => void logout()}
              >
                <LogOutIcon className="size-4" />
                {t("logOut")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </footer>
  )
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
  onClose,
  onOpenNews,
  footer,
  showBrandHeader = true,
  variant = "panel",
  className,
}: ChatHistorySidebarProps) {
  const t = useTranslations("workspace")
  const isMobileDrawer = variant === "mobile-drawer"
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
        {isMobileDrawer ? (
          <header className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,var(--app-safe-top,0px))]">
            <div className="flex min-w-0 items-start gap-3">
              <Image
                src="/Logo.png"
                alt=""
                width={36}
                height={36}
                className="block size-9 shrink-0 rounded-lg"
                priority
              />
              <div className="min-w-0 pt-0.5">
                <p className="text-[22px] font-normal leading-none tracking-tight text-foreground">
                  {t("iris")}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                  {t("historyDrawerSubtitle")}
                </p>
              </div>
            </div>
            {onClose ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 rounded-full bg-muted/50 text-foreground hover:bg-muted/70 dark:bg-muted/30"
                aria-label={t("closeChatHistory")}
                onClick={onClose}
              >
                <XIcon className="size-[18px]" />
              </Button>
            ) : null}
          </header>
        ) : showBrandHeader ? (
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
          <div
            className={cn(
              "flex flex-col pb-2",
              isMobileDrawer ? "px-3 pt-1" : "px-2"
            )}
          >
            {onNewChat ? (
              <Button
                type="button"
                variant="ghost"
                disabled={sending}
                className={cn(
                  "justify-start gap-3 text-sm font-normal shadow-none",
                  isMobileDrawer
                    ? "mb-3 h-11 w-full rounded-full bg-muted/55 px-4 hover:bg-muted/70 dark:bg-muted/35"
                    : "h-9 w-full rounded-lg px-3 hover:bg-muted/50"
                )}
                onClick={onNewChat}
              >
                <SquarePenIcon className="size-4 shrink-0 text-muted-foreground" />
                {t("newChat")}
              </Button>
            ) : null}
            {isMobileDrawer && onOpenNews ? (
              <Button
                type="button"
                variant="ghost"
                className="mb-4 h-10 w-full justify-start gap-3 rounded-lg px-3 text-[15px] font-normal shadow-none hover:bg-muted/45"
                onClick={onOpenNews}
              >
                <NewspaperIcon className="size-[18px] shrink-0 text-muted-foreground" />
                {t("news")}
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
                    compact={isMobileDrawer}
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
                  compact={isMobileDrawer}
                />
              </>
            )}
          </div>
        </ScrollArea>

        {onDock ? <ChatDeskToolsBanner onDock={onDock} /> : null}

        {isMobileDrawer ? (
          <MobileHistoryDrawerFooter onOpenNews={onOpenNews} />
        ) : (
          footer
        )}
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
  compact = false,
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
  compact?: boolean
}) {
  if (chats.length === 0) return null

  return (
    <section className={cn(compact ? "pt-2" : "pt-4", className)}>
      <p
        className={cn(
          "pb-2 text-muted-foreground",
          compact
            ? "px-1 text-[13px] font-normal"
            : "px-3 pb-1.5 text-xs"
        )}
      >
        {label}
      </p>
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
              compact={compact}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ChatConversationOptionsItems({
  pinned,
  onRename,
  onTogglePin,
  onDelete,
  menuType,
}: {
  pinned: boolean
  onRename: () => void
  onTogglePin: () => void
  onDelete: (event: React.MouseEvent) => void
  menuType: "dropdown" | "context"
}) {
  const t = useTranslations("workspace")
  const Item = menuType === "dropdown" ? DropdownMenuItem : ContextMenuItem
  const Separator =
    menuType === "dropdown" ? DropdownMenuSeparator : ContextMenuSeparator

  return (
    <>
      <Item className={chatOptionsItemClass} onClick={onRename}>
        <PencilIcon className={chatOptionsIconClass} />
        {t("renameChat")}
      </Item>
      <Item className={chatOptionsItemClass} onClick={onTogglePin}>
        {pinned ? (
          <PinOffIcon className={chatOptionsIconClass} />
        ) : (
          <PinIcon className={chatOptionsIconClass} />
        )}
        {pinned ? t("unpinChat") : t("pinChat")}
      </Item>
      <Separator className="my-1.5 bg-border/50" />
      <Item
        variant="destructive"
        className={chatOptionsDeleteClass}
        onClick={onDelete}
      >
        <Trash2Icon className="size-[18px] shrink-0" />
        {t("deleteChat")}
      </Item>
    </>
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
  compact = false,
}: {
  chat: StoredConversation
  active: boolean
  sending: boolean
  onSelect: () => void
  onRename: () => void
  onTogglePin: () => void
  onDelete: (event: React.MouseEvent) => void
  compact?: boolean
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
        className={cn(
          "min-w-0 flex-1 justify-start text-left font-normal shadow-none hover:bg-transparent",
          compact
            ? "h-10 gap-0 rounded-lg px-3 text-[15px]"
            : "h-9 gap-2.5 rounded-md px-2 text-sm"
        )}
        onClick={onSelect}
      >
        {!compact ? (
          pinned ? (
            <PinIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
          )
        ) : null}
        <span className="truncate">{chat.title}</span>
      </Button>

      <DropdownMenu modal={compact ? false : undefined}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                rowMenuButtonClass,
                compact && "opacity-100",
                active && "[@media(hover:hover)]:opacity-100"
              )}
              aria-label={t("chatOptions")}
              disabled={sending}
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <MoreHorizontalIcon className="size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className={chatOptionsMenuClass}
        >
          <ChatConversationOptionsItems
            pinned={pinned}
            onRename={onRename}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
            menuType="dropdown"
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger render={row} />
      <ContextMenuContent className={chatOptionsMenuClass}>
        <ChatConversationOptionsItems
          pinned={pinned}
          onRename={onRename}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          menuType="context"
        />
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
