"use client"

import { ReplyIcon, XIcon } from "lucide-react"

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
  return (
    <div
      className={cn(
        "mb-2 flex items-start gap-2 rounded-xl bg-foreground/[0.04] px-3 py-2",
        className
      )}
    >
      <ReplyIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Reply to {target.role}
          {target.createdAt ? ` · ${formatChatTime(target.createdAt)}` : ""}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-foreground/85">
          {target.excerpt}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 shrink-0 rounded-full text-muted-foreground"
        aria-label="Cancel reply"
        onClick={onClear}
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  )
}

export { ChatReplyChip }
