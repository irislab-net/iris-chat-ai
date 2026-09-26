"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  CheckIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
} from "@/components/app-shell/chat-context-menu-styles"
import { chatMobileHeaderButtonClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatRenameDialog } from "@/components/app-shell/chat-rename-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

type ChatThreadMenuProps = {
  title: string
  pinned: boolean
  disabled?: boolean
  onShare: () => boolean | Promise<boolean>
  onRename: (title: string) => void
  onTogglePin: () => void
  onDelete: () => void
  className?: string
}

type ChatThreadActionsProps = ChatThreadMenuProps & {
  showUpgrade?: boolean
}

function ChatThreadUpgradeButton({
  className,
}: {
  className?: string
}) {
  const t = useTranslations("workspace")

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "hidden h-8 gap-1.5 px-2 text-primary hover:bg-primary/10 hover:text-primary sm:inline-flex",
        className
      )}
      nativeButton={false}
      render={<Link href={UPGRADE_PATH} />}
    >
      <SparklesIcon className="size-3.5" />
      {t("upgrade")}
    </Button>
  )
}

function ChatThreadOptionsMenu({
  title,
  pinned,
  disabled,
  onShare,
  onRename,
  onTogglePin,
  onDelete,
  className,
}: ChatThreadMenuProps) {
  const t = useTranslations("workspace")
  const [shared, setShared] = React.useState(false)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const shareTimerRef = React.useRef(0)

  React.useEffect(() => {
    return () => window.clearTimeout(shareTimerRef.current)
  }, [])

  async function handleShare() {
    if (disabled) return
    const ok = await onShare()
    if (!ok) return
    setShared(true)
    window.clearTimeout(shareTimerRef.current)
    shareTimerRef.current = window.setTimeout(() => setShared(false), 1_600)
  }

  function openRename() {
    setRenameOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                chatMobileHeaderButtonClass,
                "size-8 shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
              )}
              aria-label={t("chatOptions")}
              disabled={disabled}
            />
          }
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className={cn(chatContextMenuContentClass, "min-w-44")}
        >
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            disabled={disabled}
            onClick={() => void handleShare()}
          >
            {shared ? (
              <CheckIcon className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <CopyIcon className={chatContextMenuIconClass} />
            )}
            {shared ? t("sharedChat") : t("shareChat")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            onClick={openRename}
          >
            <PencilIcon className={chatContextMenuIconClass} />
            {t("renameChat")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            onClick={onTogglePin}
          >
            {pinned ? (
              <PinOffIcon className={chatContextMenuIconClass} />
            ) : (
              <PinIcon className={chatContextMenuIconClass} />
            )}
            {pinned ? t("unpinChat") : t("pinChat")}
          </DropdownMenuItem>
          <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
          <DropdownMenuItem
            variant="destructive"
            className={chatContextMenuDeleteClass}
            onClick={onDelete}
          >
            <Trash2Icon className={chatContextMenuIconClass} />
            {t("deleteChat")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChatRenameDialog
        open={renameOpen}
        title={title}
        onOpenChange={setRenameOpen}
        onSubmit={onRename}
      />
    </>
  )
}

function ChatThreadActions({
  showUpgrade,
  className,
  ...menuProps
}: ChatThreadActionsProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      {showUpgrade ? <ChatThreadUpgradeButton /> : null}
      <ChatThreadOptionsMenu {...menuProps} />
    </div>
  )
}

type ChatThreadToolbarProps = ChatThreadActionsProps

function ChatThreadToolbar(props: ChatThreadToolbarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-1.5 px-3 py-2",
        props.className
      )}
    >
      <ChatThreadActions {...props} />
    </div>
  )
}

export {
  ChatThreadActions,
  ChatThreadOptionsMenu,
  ChatThreadToolbar,
  ChatThreadUpgradeButton,
}
