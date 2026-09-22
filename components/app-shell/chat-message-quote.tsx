"use client"

import { formatChatTime } from "@/lib/chat-storage"
import type { MessageQuote } from "@/lib/api/types"
import { cn } from "@/lib/utils"

function ChatMessageQuote({
  quote,
  className,
}: {
  quote: MessageQuote
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        "mb-2 w-full rounded-xl border-0 bg-foreground/[0.04] px-3 py-2 text-left transition-colors hover:bg-foreground/[0.06]",
        className
      )}
      onClick={() => {
        const el = document.getElementById(`msg-${quote.id}`)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      }}
    >
      <p className="text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {quote.role}
        {quote.created_at ? ` · ${formatChatTime(quote.created_at)}` : ""}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-foreground/80">
        {quote.excerpt}
      </p>
    </button>
  )
}

export { ChatMessageQuote }
