"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  CheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  ShareIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"

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

type ChatThreadActionsProps = {
  title: string
  pinned: boolean
  disabled?: boolean
  showUpgrade?: boolean
  onShare: () => void | Promise<void>
  onRename: (title: string) => void
  onTogglePin: () => void
  onDelete: () => void
  className?: string
}

function ChatThreadActions({
  title,
  pinned,
  disabled,
  showUpgrade,
  onShare,
  onRename,
  onTogglePin,
  onDelete,
  className,
}: ChatThreadActionsProps) {
  const t = useTranslations("workspace")
  const [shared, setShared] = React.useState(false)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameDraft, setRenameDraft] = React.useState(title)
  const shareTimerRef = React.useRef(0)

  React.useEffect(() => {
    return () => window.clearTimeout(shareTimerRef.current)
  }, [])

  React.useEffect(() => {
    if (!renameOpen) setRenameDraft(title)
  }, [title, renameOpen])

  async function handleShare() {
    if (disabled) return
    await onShare()
    setShared(true)
    window.clearTimeout(shareTimerRef.current)
    shareTimerRef.current = window.setTimeout(() => setShared(false), 1_600)
  }

  function openRename() {
    setRenameDraft(title)
    setRenameOpen(true)
  }

  function submitRename() {
    const next = renameDraft.trim()
    if (!next) return
    onRename(next)
    setRenameOpen(false)
  }

  return (
    <>
      <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
        {showUpgrade ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 gap-1.5 px-2 text-primary hover:bg-primary/10 hover:text-primary sm:inline-flex"
            nativeButton={false}
            render={<Link href={UPGRADE_PATH} />}
          >
            <SparklesIcon className="size-3.5" />
            {t("upgrade")}
          </Button>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          disabled={disabled}
          onClick={() => void handleShare()}
        >
          {shared ? (
            <CheckIcon className="size-3.5 text-emerald-600" />
          ) : (
            <ShareIcon className="size-3.5" />
          )}
          {shared ? t("sharedChat") : t("shareChat")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="size-8 shrink-0"
                aria-label={t("chatOptions")}
                disabled={disabled}
              />
            }
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem className="gap-2" onClick={openRename}>
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

      <ChatRenameDialog
        open={renameOpen}
        value={renameDraft}
        onValueChange={setRenameDraft}
        onOpenChange={setRenameOpen}
        onSubmit={submitRename}
      />
    </>
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

export { ChatThreadActions, ChatThreadToolbar }
