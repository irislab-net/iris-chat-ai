"use client"

import { ReplyIcon, XIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { formatChatTime } from "@/lib/chat-storage"
import { cn } from "@/lib/utils"

export type ChatReplyTarget = {
  id: number
  role: "user" | "assistant"
  excerpt: string
  createdAt: string
}

function ChatReplyChip({
  target,
  onClear,
  className,
}: {
  target: ChatReplyTarget
  onClear: () => void
  className?: string
}) {
  const t = useTranslations("workspace")
  const locale = useLocale()

  return (
    <div
      className={cn(
        "mb-2 flex items-start gap-2 rounded-2xl border-s-2 border-s-foreground/18 bg-[rgba(118,118,128,0.08)] px-3.5 py-2.5",
        "dark:border-s-white/22 dark:bg-white/[0.06]",
        className
      )}
    >
      <ReplyIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium leading-3.25 tracking-[0.006em] text-muted-foreground">
          {target.role === "user" ? t("replyToUser") : t("replyToAssistant")}
          {target.createdAt
            ? ` · ${formatChatTime(target.createdAt, locale)}`
            : ""}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-4.5 tracking-[-0.006em] text-foreground/85">
          {target.excerpt}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 shrink-0 rounded-full text-muted-foreground hover:bg-[rgba(118,118,128,0.12)] dark:hover:bg-[rgba(118,118,128,0.24)]"
        aria-label={t("cancelReply")}
        onClick={onClear}
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  )
}

export { ChatReplyChip }
