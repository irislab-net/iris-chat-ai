"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  EclipseIcon,
  LogOutIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  NewspaperIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  ReceiptIcon,
  Settings,
  SparklesIcon,
  Trash2Icon,
  XIcon,
  HouseIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { AttentionPulseDot } from "@/components/app-shell/attention-pulse-dot"
import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import { ChatGeminiNewChatIcon } from "@/components/app-shell/chat-gemini-new-chat-icon"
import { ExurLogo } from "@/components/brand/exur-logo"
import { useAuth } from "@/components/auth/auth-provider"
import { displayPlanName } from "@/lib/billing/catalog"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  chatMobileDrawerFooterBarClass,
  chatMobileDrawerFooterFadeClass,
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
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  sortConversations,
  type StoredConversation,
} from "@/lib/chat-storage"
import { CHAT_HISTORY_RAIL_COLLAPSED_WIDTH } from "@/lib/chat-history-rail-prefs"
import { BILLING_PATH, getLandingHref, UPGRADE_PATH } from "@/lib/site"
import {
  userAccountLabel,
  userAccountSubline,
} from "@/lib/user-profile"
import { cn } from "@/lib/utils"

const rowMenuButtonClass =
  "size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"

/** Desktop rail — hide until row hover/focus. Touch has no hover, so compact skips this. */
const rowMenuButtonHoverRevealClass =
  "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/item:opacity-100 [@media(hover:hover)]:group-focus-within/item:opacity-100"

const historyRailIconButtonClass =
  "size-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"

function HistoryRailToggleButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const t = useTranslations("workspace")
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
            className={historyRailIconButtonClass}
            aria-label={label}
            aria-expanded={!collapsed}
            onClick={onToggle}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
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

  if (minimal) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(historyRailIconButtonClass, "relative")}
              aria-label={t("news")}
              onClick={(event) => {
                event.stopPropagation()
                onOpenNews()
              }}
            >
              <NewspaperIcon className="size-4.5" />
              {showSpotlight ? (
                <AttentionPulseDot className="-top-0.5 inset-e-1" />
              ) : null}
            </Button>
          }
        >
          <NewspaperIcon className="size-4.5" />
        </TooltipTrigger>
        <TooltipContent side="right">{t("news")}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "relative justify-start gap-3 text-sm font-normal shadow-none",
        isMobileDrawer
          ? cn("mb-1", chatMobileDrawerNavItemClass)
          : "mb-1 h-9 w-full rounded-lg px-3 hover:bg-muted/50"
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
        <AttentionPulseDot className="top-1 inset-e-2.5" />
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
  const landingHref = getLandingHref()

  if (minimal) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={historyRailIconButtonClass}
              aria-label={t("home")}
              nativeButton={false}
              render={<a href={landingHref} />}
            >
              <HouseIcon className="size-4.5" />
            </Button>
          }
        >
          <HouseIcon className="size-4.5" />
        </TooltipTrigger>
        <TooltipContent side="right">{t("home")}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "justify-start gap-3 text-sm font-normal shadow-none",
        isMobileDrawer
          ? cn("mb-1", chatMobileDrawerNavItemClass)
          : "mb-2 h-9 w-full rounded-lg px-3 hover:bg-muted/50"
      )}
      nativeButton={false}
      render={<a href={landingHref} />}
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
  const { user, isProUser, login, logout, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <footer className={chatMobileDrawerFooterWrapClass}>
      <div aria-hidden className={chatMobileDrawerFooterFadeClass} />
      <div
        className={cn(
          chatMobileDrawerFooterBarClass,
          "flex items-center gap-2 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
        )}
      >
      {user ? (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <ChatAccountAvatar
            user={user}
            avatarUrl={avatarUrl}
            isProUser={isProUser}
            planName={displayPlanName(user.tier)}
            compact
            avatarClassName="size-9"
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-normal leading-tight">
              {userAccountLabel(user)}
            </p>
            {userAccountSubline(user) ? (
              <p className="truncate text-[13px] text-muted-foreground">
                {userAccountSubline(user)}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 flex-1 justify-start gap-2.5 px-1 text-[15px] font-normal"
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
      {user && !isProUser ? (
        <Button
          size="sm"
          className={chatMobileDrawerUpgradeClass}
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
              className={cn(chatMobileHeaderButtonClass, "size-9 shrink-0")}
              aria-label={common("settings")}
            />
          }
        >
          <Settings className="size-4.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          className={cn(chatContextMenuContentClass, "min-w-56")}
        >
          {user && !isProUser ? (
            <DropdownMenuItem
              className={chatContextMenuItemClass}
              nativeButton={false}
              render={<Link href={UPGRADE_PATH} />}
            >
              <SparklesIcon className={chatContextMenuIconClass} />
              {t("upgradeToPlus")}
            </DropdownMenuItem>
          ) : null}
          {user ? (
            <DropdownMenuItem
              className={chatContextMenuItemClass}
              nativeButton={false}
              render={<Link href={BILLING_PATH} />}
            >
              <ReceiptIcon className={chatContextMenuIconClass} />
              {t("billing")}
            </DropdownMenuItem>
          ) : null}
          {onOpenNews ? (
            <DropdownMenuItem
              className={chatContextMenuItemClass}
              onClick={onOpenNews}
            >
              <NewspaperIcon className={chatContextMenuIconClass} />
              {t("news")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <EclipseIcon className={chatContextMenuIconClass} />
            {resolvedTheme === "dark" ? common("lightMode") : common("darkMode")}
          </DropdownMenuItem>
          {user ? (
            <>
              <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
              <DropdownMenuItem
                variant="destructive"
                className={chatContextMenuDeleteClass}
                onClick={() => void logout()}
              >
                <LogOutIcon className="size-4.5 shrink-0" />
                {t("logOut")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
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
  const isMobileDrawer = variant === "mobile-drawer"
  const [renameTarget, setRenameTarget] =
    React.useState<StoredConversation | null>(null)

  const sorted = React.useMemo(
    () => sortConversations(conversations),
    [conversations]
  )
  const pinned = sorted.filter((chat) => chat.pinned)
  const recent = sorted.filter((chat) => !chat.pinned)

  function openRename(chat: StoredConversation) {
    setRenameTarget(chat)
  }

  function closeRename() {
    setRenameTarget(null)
  }

  return (
    <>
      <div
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
                priority
                size={32}
                className="size-8 shrink-0 overflow-hidden rounded-full"
              />
              <h2 className="text-lg font-normal leading-none tracking-tight text-foreground">
                {t("iris")}
              </h2>
            </div>
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
          </header>
        ) : showBrandHeader ? (
          <header
            className={cn(
              "flex shrink-0 items-center gap-1 pt-2.5 pb-1",
              collapsed ? "flex-col px-1" : "px-2"
            )}
          >
            <div
              className={cn(
                "flex min-w-0 items-center gap-2.5",
                collapsed
                  ? "justify-center px-0"
                  : "flex-1 px-1"
              )}
            >
              <ExurLogo
                decorative
                variant="gradient"
                size={32}
                className="size-8 shrink-0 overflow-hidden rounded-full"
              />
              {!collapsed ? (
                <span className="min-w-0 truncate text-[15px] font-normal leading-none tracking-tight text-sidebar-foreground/90">
                  {t("iris")}
                </span>
              ) : null}
            </div>
            {onToggleCollapsed ? (
              <HistoryRailToggleButton
                collapsed={collapsed}
                onToggle={onToggleCollapsed}
              />
            ) : null}
          </header>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <div
            className={cn(
              "flex flex-col",
              isMobileDrawer
                ? "px-2 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] pt-3"
                : showBrandHeader
                  ? "px-2 pb-2 pt-3"
                  : "px-2 pb-2 pt-1"
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
                        className={cn(historyRailIconButtonClass, "mx-auto")}
                        aria-label={t("newChat")}
                        onClick={onNewChat}
                      />
                    }
                  >
                    <ChatGeminiNewChatIcon className="h-4.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right">{t("newChat")}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={sending}
                  className={cn(
                    "justify-start gap-3 text-sm font-normal shadow-none",
                    isMobileDrawer
                      ? cn("mb-1", chatMobileDrawerNavItemClass)
                      : "h-9 w-full rounded-lg px-3 hover:bg-muted/50"
                  )}
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

            {collapsed && !isMobileDrawer ? null : conversations.length === 0 ? (
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

                {pinned.length > 0 && recent.length > 0 && !isMobileDrawer ? (
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

        {isMobileDrawer ? (
          <MobileHistoryDrawerFooter onOpenNews={onOpenNews} />
        ) : (
          footer
        )}
      </div>

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
          compact
            ? chatMobileDrawerSectionLabelClass
            : "px-3 pb-1.5 text-xs text-muted-foreground"
        )}
      >
        {label}
      </p>
      <ul className={cn("flex flex-col", compact ? "gap-0.5 px-1" : "gap-0.5")}>
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
      <Item className={chatContextMenuItemClass} onClick={onRename}>
        <PencilIcon className={chatContextMenuIconClass} />
        {t("renameChat")}
      </Item>
      <Item className={chatContextMenuItemClass} onClick={onTogglePin}>
        {pinned ? (
          <PinOffIcon className={chatContextMenuIconClass} />
        ) : (
          <PinIcon className={chatContextMenuIconClass} />
        )}
        {pinned ? t("unpinChat") : t("pinChat")}
      </Item>
      <Separator className={chatContextMenuSeparatorClass} />
      <Item
        variant="destructive"
        className={chatContextMenuDeleteClass}
        onClick={onDelete}
      >
        <Trash2Icon className="size-4.5 shrink-0" />
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
        "group/item relative flex min-w-0 items-center transition-colors",
        compact
          ? cn(
              "rounded-full px-1",
              active
                ? "bg-muted/75 dark:bg-muted/45"
                : "hover:bg-muted/45 dark:hover:bg-muted/30"
            )
          : cn(
              "gap-1 rounded-lg px-1 py-0.5",
              active ? "bg-muted" : "hover:bg-muted/50"
            )
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "min-w-0 flex-1 justify-start text-left font-normal shadow-none hover:bg-transparent",
          compact
            ? "h-11 gap-0 rounded-full px-4 pe-1 text-[15px]"
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
          <MoreHorizontalIcon className={compact ? "size-5" : "size-4.5"} />
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
  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        className
      )}
      style={{ width: collapsed ? CHAT_HISTORY_RAIL_COLLAPSED_WIDTH : sidebarWidth }}
      aria-label={t("chatHistory")}
      data-collapsed={collapsed ? "true" : undefined}
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
