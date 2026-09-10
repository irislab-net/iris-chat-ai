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

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

type ChatConversationToolbarProps = {
  title: string
  pinned?: boolean
  disabled?: boolean
  showUpgrade?: boolean
  onShare: () => Promise<boolean>
  onTogglePin: () => void
  onRename: (title: string) => void
  onDelete: () => void
  className?: string
}

function ChatConversationToolbar({
  title,
  pinned = false,
  disabled,
  showUpgrade = false,
  onShare,
  onTogglePin,
  onRename,
  onDelete,
  className,
}: ChatConversationToolbarProps) {
  const t = useTranslations("workspace")
  const [shareCopied, setShareCopied] = React.useState(false)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameDraft, setRenameDraft] = React.useState(title)
  const shareTimerRef = React.useRef(0)

  React.useEffect(() => {
    setRenameDraft(title)
  }, [title])

  React.useEffect(() => {
    return () => window.clearTimeout(shareTimerRef.current)
  }, [])

  async function handleShare() {
    if (disabled) return
    const ok = await onShare()
    if (!ok) return
    setShareCopied(true)
    window.clearTimeout(shareTimerRef.current)
    shareTimerRef.current = window.setTimeout(() => setShareCopied(false), 1_600)
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
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 border-b border-border/60 px-3 py-2 sm:px-4",
          className
        )}
      >
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/90 sm:hidden">
          {title}
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {showUpgrade ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-primary hover:bg-primary/10 hover:text-primary"
              nativeButton={false}
              render={<Link href={UPGRADE_PATH} />}
            >
              <SparklesIcon className="size-4" />
              <span className="hidden sm:inline">{t("upgrade")}</span>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-foreground"
            disabled={disabled}
            onClick={() => void handleShare()}
          >
            {shareCopied ? (
              <CheckIcon className="size-4 text-emerald-600" />
            ) : (
              <ShareIcon className="size-4" />
            )}
            <span className="hidden sm:inline">
              {shareCopied ? t("shareChatCopied") : t("shareChat")}
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 rounded-lg bg-muted/50 text-foreground hover:bg-muted"
                  aria-label={t("chatOptions")}
                  disabled={disabled}
                />
              }
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
              <DropdownMenuItem className="gap-2" onClick={onTogglePin}>
                {pinned ? <PinOffIcon /> : <PinIcon />}
                {pinned ? t("unpinChat") : t("pinChat")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={openRename}>
                <PencilIcon />
                {t("renameChat")}
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
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("renameChat")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="conversation-rename-title">{t("renameChatLabel")}</Label>
            <Input
              id="conversation-rename-title"
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitRename()
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameOpen(false)}
            >
              {t("cancelRename")}
            </Button>
            <Button
              type="button"
              disabled={!renameDraft.trim()}
              onClick={submitRename}
            >
              {t("saveRename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ChatConversationToolbar }
