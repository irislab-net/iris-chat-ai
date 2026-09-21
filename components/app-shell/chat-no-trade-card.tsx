"use client"

import { chatSignalCardClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

function ChatNoTradeCard({
  reason,
  className,
}: {
  reason: string
  className?: string
}) {
  const text = reason.trim()
  if (!text) return null

  return (
    <article className={cn("mt-1.5", chatSignalCardClass, className)}>
      <div className="px-4 py-4">
        <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          No trade
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </article>
  )
}

export { ChatNoTradeCard }
