"use client"

import { useLocale, useTranslations } from "next-intl"

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
  const t = useTranslations("workspace")
  const locale = useLocale()
  const roleLabel =
    quote.role === "user" ? t("replyToUser") : t("replyToAssistant")

  return (
    <button
      type="button"
      className={cn(
        "mb-2 w-full rounded-2xl border-s-2 border-s-foreground/18 bg-[rgba(118,118,128,0.08)] px-3.5 py-2.5 text-start transition-[background-color,transform] duration-150",
        "hover:bg-[rgba(118,118,128,0.12)] active:scale-[0.995]",
        "dark:border-s-white/22 dark:bg-white/6 dark:hover:bg-white/10",
        className
      )}
      onClick={() => {
        const el = document.getElementById(`msg-${quote.id}`)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      }}
    >
      <p className="text-[11px] font-medium leading-3.25 tracking-[0.006em] text-muted-foreground">
        {roleLabel}
        {quote.created_at
          ? ` · ${formatChatTime(quote.created_at, locale)}`
          : ""}
      </p>
      <p className="mt-1 line-clamp-2 text-[13px] leading-4.5 tracking-[-0.006em] text-foreground/80">
        {quote.excerpt}
      </p>
    </button>
  )
}

export { ChatMessageQuote }
