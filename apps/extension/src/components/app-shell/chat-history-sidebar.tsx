"use client"

import * as React from "react"
import {
  MessageSquareIcon,
  NewspaperIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SearchIcon,
  Settings,
  XIcon,
  HouseIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { AttentionPulseDot } from "@/components/app-shell/attention-pulse-dot"
import {
  ChatAccountAvatar,
  ChatGuestAvatar,
} from "@/components/app-shell/chat-account-avatar"
import { ChatAccountMenu } from "@/components/app-shell/chat-account-menu"
import { ChatGeminiNewChatIcon } from "@/components/app-shell/chat-gemini-new-chat-icon"
import { ChatHistorySearchDialog } from "@/components/app-shell/chat-history-search-dialog"
import {
  SfBubbleIcon,
  SfEllipsisIcon,
  SfPencilIcon,
  SfPinIcon,
  SfPinSlashIcon,
  SfTrashIcon,
} from "@/components/icons/sf-menu-icons"
import { ExurLogo } from "@/components/brand/exur-logo"
import { useAuth } from "@/components/auth/auth-provider"
import { displayPlanName } from "@/lib/billing/catalog"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
} from "@/components/app-shell/chat-context-menu-styles"
import {
  chatDesktopSidebarIconButtonClass,
  chatHistoryRailChatItemClass,
  chatHistoryRailChatItemPadClass,
  chatHistoryRailGlassItemActiveClass,
  chatHistoryRailHeaderBarClass,
  chatHistoryRailHeaderWrapClass,
  chatHistoryRailNavItemClass,
  chatHistoryRailSectionLabelClass,
  chatMobileDrawerFooterBarClass,
  chatMobileDrawerFooterWrapClass,
  chatMobileDrawerNavItemClass,
  chatMobileDrawerSectionLabelClass,
  chatMobileDrawerSurfaceClass,
  chatMobileDrawerUpgradeClass,
  chatMobileHeaderButtonClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  NEW_CHAT_TITLE,
  sortConversations,
  type StoredConversation,
} from "@/lib/chat-storage"
import { CHAT_HISTORY_RAIL_COLLAPSED_WIDTH } from "@/lib/chat-history-rail-prefs"
import { localeDirection } from "@/lib/i18n/locale"
import { getLandingHref, UPGRADE_PATH } from "@/lib/site"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

function useSidebarDir() {
  const dir = localeDirection(useLocale())
  return {
    dir,
    isRtl: dir === "rtl",
    tooltipSide: (dir === "rtl" ? "left" : "right") as "left" | "right",
  }
}

const rowMenuButtonClass =
  "size-8 shrink-0 rounded-full text-muted-foreground transition-colors duration-150 hover:bg-[rgba(118,118,128,0.12)] hover:text-foreground dark:hover:bg-[rgba(118,118,128,0.24)]"

/** Desktop rail — hide until row hover/focus. Touch has no hover, so compact skips this. */
const rowMenuButtonHoverRevealClass =
  "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/item:opacity-100 [@media(hover:hover)]:group-focus-within/item:opacity-100"

const historyRailGlassIconButtonClass = chatDesktopSidebarIconButtonClass

function HistoryRailSearchButton({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("workspace")
  const { tooltipSide } = useSidebarDir()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={historyRailGlassIconButtonClass}
            aria-label={t("searchChats")}
            onClick={onOpen}
          />
        }
      >
        <SearchIcon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{t("searchChats")}</TooltipContent>
    </Tooltip>
  )
}

function HistoryRailToggleButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const t = useTranslations("workspace")
  const { isRtl, tooltipSide } = useSidebarDir()
  const label = collapsed ? t("expandChatHistory") : t("collapseChatHistory")
  const Icon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={historyRailGlassIconButtonClass}
            aria-label={label}
            aria-expanded={!collapsed}
            onClick={onToggle}
          />
        }
      >
        <Icon className={cn("size-4", isRtl && "rtl-mirror")} />
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  )
}

function HistoryNewsNav({
  onOpenNews,
  isMobileDrawer = false,
  minimal = false,
  showSpotlight = false,
}: {
  onOpenNews: () => void
  isMobileDrawer?: boolean
  minimal?: boolean
  showSpotlight?: boolean
}) {
  const t = useTranslations("workspace")
  const { tooltipSide } = useSidebarDir()

  if (minimal) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(historyRailGlassIconButtonClass, "relative")}
              aria-label={t("news")}
              onClick={(event) => {
                event.stopPropagation()
                onOpenNews()
              }}
            >
              <NewspaperIcon className="size-4.5" />
              {showSpotlight ? (
                <AttentionPulseDot className="inset-e-1 -top-0.5" />
              ) : null}
            </Button>
          }
        >
          <NewspaperIcon className="size-4.5" />
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{t("news")}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "relative",
        isMobileDrawer
          ? chatMobileDrawerNavItemClass
          : chatHistoryRailNavItemClass
      )}
      onClick={(event) => {
        event.stopPropagation()
        onOpenNews()
      }}
    >
      <NewspaperIcon
        className={cn(
          "shrink-0 text-muted-foreground",
          isMobileDrawer ? "size-4.5" : "size-4"
        )}
      />
      <span className="min-w-0 flex-1 truncate text-start">{t("news")}</span>
      {showSpotlight ? (
        <AttentionPulseDot className="inset-e-2.5 top-1" />
      ) : null}
    </Button>
  )
}

function HistoryHomeNav({
  isMobileDrawer = false,
  minimal = false,
}: {
  isMobileDrawer?: boolean
  minimal?: boolean
}) {
  const t = useTranslations("workspace")
  const { tooltipSide } = useSidebarDir()
  const landingHref = getLandingHref()

  if (minimal) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={historyRailGlassIconButtonClass}
              aria-label={t("home")}
              nativeButton={false}
              render={
                <a
                  href={landingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <HouseIcon className="size-4.5" />
            </Button>
          }
        >
          <HouseIcon className="size-4.5" />
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{t("home")}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      variant="ghost"
      className={
        isMobileDrawer
          ? chatMobileDrawerNavItemClass
          : chatHistoryRailNavItemClass
      }
      nativeButton={false}
      render={
        <a href={landingHref} target="_blank" rel="noopener noreferrer" />
      }
    >
      <HouseIcon
        className={cn(
          "shrink-0 text-muted-foreground",
          isMobileDrawer ? "size-4.5" : "size-4"
        )}
      />
      <span className="min-w-0 flex-1 truncate text-start">{t("home")}</span>
    </Button>
  )
}

type ChatHistorySidebarProps = {
  conversations: StoredConversation[]
  conversationId: string
  sending: boolean
  /** Session ids waiting on backend DELETE confirmation — shown as row skeletons. */
  deletingIds?: ReadonlySet<string>
  onSelect: (id: string) => void
  onDelete: (id: string, event: React.MouseEvent) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
  onNewChat?: () => void
  onClose?: () => void
  onOpenNews?: () => void
  showNewsSpotlight?: boolean
  footer?: React.ReactNode
  showBrandHeader?: boolean
  variant?: "panel" | "mobile-drawer"
  collapsed?: boolean
  onToggleCollapsed?: () => void
  className?: string
}

function MobileHistoryDrawerFooter({
  onOpenNews,
}: {
  onOpenNews?: () => void
}) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const { user, isProUser, login, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)

  return (
    <footer className={chatMobileDrawerFooterWrapClass}>
      <div
        className={cn(
          chatMobileDrawerFooterBarClass,
          "flex items-center gap-2 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
        )}
      >
        {user ? (
          <ChatAccountMenu
            variant="mobile"
            sheetInitialView="root"
            onOpenNews={onOpenNews}
            className="h-11 min-w-0 flex-1 justify-start gap-2.5 rounded-full px-1"
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 min-w-0 flex-1 justify-start gap-2.5 rounded-full px-1.5 text-[15px] font-normal"
                aria-label={t("accountMenuFor", {
                  name: userAccountLabel(user),
                })}
              >
                <ChatAccountAvatar
                  user={user}
                  avatarUrl={avatarUrl}
                  isProUser={isProUser}
                  planName={displayPlanName(user.tier)}
                  compact
                  avatarClassName="size-9"
                />
                <span className="min-w-0 text-start">
                  <span className="block truncate text-[15px] leading-tight font-normal">
                    {userAccountLabel(user)}
                  </span>
                  {userAccountSubline(user) ? (
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {userAccountSubline(user)}
                    </span>
                  ) : null}
                </span>
              </Button>
            }
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 flex-1 justify-start gap-2.5 rounded-full px-1.5 text-[15px] font-normal"
            disabled={loginPending}
            onClick={() => login({ source: "chat" })}
          >
            <ChatGuestAvatar avatarClassName="size-9" />
            {loginPending ? t("connecting") : t("signIn")}
          </Button>
        )}
        {user && !isProUser ? (
          <Button
            size="sm"
            className={chatMobileDrawerUpgradeClass}
            nativeButton={false}
            render={
              <a href={UPGRADE_PATH} target="_blank" rel="noopener noreferrer" />
            }
          >
            {t("upgrade")}
          </Button>
        ) : null}
        <ChatAccountMenu
          variant="mobile"
          sheetInitialView="settings"
          onOpenNews={onOpenNews}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(chatMobileHeaderButtonClass, "shrink-0")}
              aria-label={common("settings")}
            >
              <Settings className="size-5" />
            </Button>
          }
        />
      </div>
    </footer>
  )
}

function ChatHistorySidebar({
  conversations,
  conversationId,
  sending,
  deletingIds,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  onNewChat,
  onClose,
  onOpenNews,
  showNewsSpotlight = false,
  footer,
  showBrandHeader = true,
  variant = "panel",
  collapsed = false,
  onToggleCollapsed,
  className,
}: ChatHistorySidebarProps) {
  const t = useTranslations("workspace")
  const { dir, tooltipSide } = useSidebarDir()
  const isMobileDrawer = variant === "mobile-drawer"
  const [renameTarget, setRenameTarget] =
    React.useState<StoredConversation | null>(null)
  const [searchOpen, setSearchOpen] = React.useState(false)

  const sorted = React.useMemo(
    () => sortConversations(conversations),
    [conversations]
  )
  const pinned = sorted.filter((chat) => chat.pinned)
  const recent = sorted.filter((chat) => !chat.pinned)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k"
      ) {
        return
      }
      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          "input, textarea, select, [contenteditable=true], [role='textbox']"
        )
      ) {
        return
      }
      event.preventDefault()
      setSearchOpen(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function openRename(chat: StoredConversation) {
    setRenameTarget(chat)
  }

  function closeRename() {
    setRenameTarget(null)
  }

  return (
    <>
      <div
        dir={dir}
        className={cn(
          "flex h-full min-h-0 flex-col",
          isMobileDrawer && chatMobileDrawerSurfaceClass,
          className
        )}
      >
        {isMobileDrawer ? (
          <header className="app-mobile-safe-header flex shrink-0 items-center justify-between gap-3 px-4 pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <ExurLogo
                decorative
                variant="gradient"
                shimmer
                priority
                size={40}
                className="size-10 shrink-0 overflow-hidden rounded-full"
              />
              <h2 className="text-lg leading-none font-normal tracking-tight text-foreground">
                {t("iris")}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={chatMobileHeaderButtonClass}
                aria-label={t("searchChats")}
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon className="size-4.5" />
              </Button>
              {onClose ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={chatMobileHeaderButtonClass}
                  aria-label={t("closeChatHistory")}
                  onClick={onClose}
                >
                  <XIcon className="size-4.5" />
                </Button>
              ) : null}
            </div>
          </header>
        ) : showBrandHeader ? (
          <header
            className={cn(
              chatHistoryRailHeaderWrapClass,
              collapsed ? "flex-col" : undefined
            )}
          >
            <div
              className={cn(
                chatHistoryRailHeaderBarClass,
                "flex items-center pt-2.5 pb-1",
                collapsed ? "flex-col gap-4 px-1" : "gap-1 px-2"
              )}
            >
              <div
                className={cn(
                  "flex min-w-0 items-center gap-2.5",
                  collapsed ? "justify-center px-0" : "flex-1 px-1"
                )}
              >
                <ExurLogo
                  decorative
                  variant="gradient"
                  shimmer
                  size={40}
                  className="size-10 shrink-0 overflow-hidden rounded-full"
                />
                {!collapsed ? (
                  <span className="min-w-0 truncate text-[15px] leading-none font-medium tracking-tight text-sidebar-foreground">
                    {t("iris")}
                  </span>
                ) : null}
              </div>
              <div
                className={cn(
                  "flex shrink-0 items-center",
                  collapsed ? "flex-col gap-3" : "gap-1"
                )}
              >
                <HistoryRailSearchButton onOpen={() => setSearchOpen(true)} />
                {onToggleCollapsed ? (
                  <HistoryRailToggleButton
                    collapsed={collapsed}
                    onToggle={onToggleCollapsed}
                  />
                ) : null}
              </div>
            </div>
          </header>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <div
            className={cn(
              "flex flex-col",
                isMobileDrawer
                ? "gap-1.5 px-3.5 pt-3 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))]"
                : showBrandHeader
                  ? "gap-1.5 px-2 pt-3 pb-4"
                  : "gap-1.5 px-2 pt-1 pb-4"
            )}
          >
            <div
              className={cn(
                "flex flex-col",
                collapsed && !isMobileDrawer ? "gap-4 items-center" : "gap-1.5"
              )}
            >
              {onNewChat ? (
                collapsed && !isMobileDrawer ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={sending}
                          className={historyRailGlassIconButtonClass}
                          aria-label={t("newChat")}
                          onClick={onNewChat}
                        />
                      }
                    >
                      <ChatGeminiNewChatIcon className="h-4.5" />
                    </TooltipTrigger>
                    <TooltipContent side={tooltipSide}>
                      {t("newChat")}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={sending}
                    className={
                      isMobileDrawer
                        ? chatMobileDrawerNavItemClass
                        : chatHistoryRailNavItemClass
                    }
                    onClick={onNewChat}
                  >
                    <ChatGeminiNewChatIcon
                      className={cn(
                        "text-foreground",
                        isMobileDrawer ? "h-4.5" : "h-4"
                      )}
                    />
                    {t("newChat")}
                  </Button>
                )
              ) : null}
              {onOpenNews ? (
                <HistoryNewsNav
                  onOpenNews={onOpenNews}
                  isMobileDrawer={isMobileDrawer}
                  minimal={collapsed && !isMobileDrawer}
                  showSpotlight={showNewsSpotlight}
                />
              ) : null}
              <HistoryHomeNav
                isMobileDrawer={isMobileDrawer}
                minimal={collapsed && !isMobileDrawer}
              />
            </div>

            {collapsed && !isMobileDrawer ? null : conversations.length ===
              0 ? (
              <Empty className="mx-1 mt-4 border-0 p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquareIcon />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">
                    {t("noSavedChats")}
                  </EmptyTitle>
                  <EmptyDescription className="text-xs">
                    {t("emptySignedIn")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="mt-3 flex flex-col gap-4">
                {pinned.length > 0 ? (
                  <ConversationSection
                    label={t("pinnedChats")}
                    chats={pinned}
                    conversationId={conversationId}
                    sending={sending}
                    deletingIds={deletingIds}
                    onSelect={onSelect}
                    onRename={openRename}
                    onTogglePin={onTogglePin}
                    onDelete={onDelete}
                    compact={isMobileDrawer}
                  />
                ) : null}

                <ConversationSection
                  label={t("recentChats")}
                  chats={recent}
                  conversationId={conversationId}
                  sending={sending}
                  deletingIds={deletingIds}
                  onSelect={onSelect}
                  onRename={openRename}
                  onTogglePin={onTogglePin}
                  onDelete={onDelete}
                  compact={isMobileDrawer}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {isMobileDrawer ? (
          <MobileHistoryDrawerFooter onOpenNews={onOpenNews} />
        ) : (
          footer
        )}
      </div>

      <ChatHistorySearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        conversations={conversations}
        conversationId={conversationId}
        onSelect={onSelect}
      />

      <ChatRenameDialog
        open={renameTarget != null}
        title={renameTarget?.title ?? ""}
        onOpenChange={(open) => {
          if (!open) closeRename()
        }}
        onSubmit={(next) => {
          if (!renameTarget) return
          onRename(renameTarget.id, next)
        }}
      />
    </>
  )
}

function ConversationSection({
  label,
  chats,
  conversationId,
  sending,
  deletingIds,
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
  deletingIds?: ReadonlySet<string>
  onSelect: (id: string) => void
  onRename: (chat: StoredConversation) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string, event: React.MouseEvent) => void
  className?: string
  compact?: boolean
}) {
  if (chats.length === 0) return null

  return (
    <section className={className}>
      <p
        className={cn(
          compact
            ? chatMobileDrawerSectionLabelClass
            : chatHistoryRailSectionLabelClass
        )}
      >
        {label}
      </p>
      <ul className={cn("flex flex-col", compact ? "gap-1.5 px-1" : "gap-1.5")}>
        {chats.map((chat) => (
          <li key={chat.id}>
            {deletingIds?.has(chat.id) ? (
              <ConversationRowSkeleton compact={compact} />
            ) : (
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
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ConversationRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "chat-skeleton-shimmer w-full rounded-2xl",
        compact ? "h-11" : "h-9"
      )}
      aria-busy="true"
      role="status"
    />
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
      <Item className={chatContextMenuItemClass} onClick={onRename}>
        <SfPencilIcon className={chatContextMenuIconClass} />
        {t("renameChat")}
      </Item>
      <Item className={chatContextMenuItemClass} onClick={onTogglePin}>
        {pinned ? (
          <SfPinSlashIcon className={chatContextMenuIconClass} />
        ) : (
          <SfPinIcon className={chatContextMenuIconClass} />
        )}
        {pinned ? t("unpinChat") : t("pinChat")}
      </Item>
      <Separator className={chatContextMenuSeparatorClass} />
      <Item
        variant="destructive"
        className={chatContextMenuDeleteClass}
        onClick={onDelete}
      >
        <SfTrashIcon className="size-4.5 shrink-0" />
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
  const title =
    !chat.title.trim() || chat.title === NEW_CHAT_TITLE
      ? t("newChat")
      : chat.title

  const row = (
    <div
      className={cn(
        chatHistoryRailChatItemClass,
        chatHistoryRailChatItemPadClass,
        active && chatHistoryRailGlassItemActiveClass
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "min-w-0 flex-1 justify-start text-start font-normal shadow-none hover:bg-transparent",
          compact
            ? "h-11 gap-0 rounded-2xl px-4 pe-1 text-[15px]"
            : "h-9 gap-2.5 rounded-2xl px-2 text-sm"
        )}
        onClick={onSelect}
      >
        {!compact ? (
          pinned ? (
            <SfPinIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <SfBubbleIcon className="size-4 shrink-0 text-muted-foreground" />
          )
        ) : null}
        <span className="truncate">{title}</span>
      </Button>

      <DropdownMenu modal={undefined}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                rowMenuButtonClass,
                compact
                  ? "size-9 opacity-100"
                  : cn(
                      rowMenuButtonHoverRevealClass,
                      active && "[@media(hover:hover)]:opacity-100"
                    )
              )}
              aria-label={t("chatOptions")}
              disabled={sending}
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <SfEllipsisIcon className={compact ? "size-5" : "size-4.5"} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className={chatContextMenuContentClass}
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
      <ContextMenuContent
        sideOffset={8}
        className={chatContextMenuContentClass}
      >
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
  deletingIds,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  onNewChat,
  onOpenNews,
  showNewsSpotlight,
  footer,
  sidebarWidth,
  collapsed = false,
  onToggleCollapsed,
  className,
}: ChatHistorySidebarProps & {
  sidebarWidth: string
}) {
  const t = useTranslations("workspace")
  const { dir } = useSidebarDir()
  return (
    <aside
      dir={dir}
      data-slot="chat-history-rail"
      className={cn(
        "relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-r-xl bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        className
      )}
      style={{
        width: collapsed ? CHAT_HISTORY_RAIL_COLLAPSED_WIDTH : sidebarWidth,
      }}
      aria-label={t("chatHistory")}
      data-collapsed={collapsed ? "true" : undefined}
    >
      <ChatHistorySidebar
        conversations={conversations}
        conversationId={conversationId}
        sending={sending}
        deletingIds={deletingIds}
        onSelect={onSelect}
        onDelete={onDelete}
        onRename={onRename}
        onTogglePin={onTogglePin}
        onNewChat={onNewChat}
        onOpenNews={onOpenNews}
        showNewsSpotlight={showNewsSpotlight}
        footer={footer}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        className="min-h-0 flex-1"
      />
    </aside>
  )
}

export { ChatHistoryRail, ChatHistorySidebar }
