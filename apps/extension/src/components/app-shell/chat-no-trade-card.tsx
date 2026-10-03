"use client"

import { PauseCircleIcon, ShieldCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatSignalCardClass,
  chatSignalCardIconShellClass,
  chatSignalCardInsetClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

const noTradeWashClass =
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(245,158,11,0.14),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.06),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,transparent_42%)] before:content-[''] dark:before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(251,191,36,0.16),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(96,165,250,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"

const noTradeChipClass =
  "inline-flex items-center gap-1 rounded-full border-0 bg-amber-500/16 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-amber-800 shadow-none backdrop-blur-md dark:bg-amber-400/18 dark:text-amber-200 dark:shadow-none"

const capitalProtectedChipClass =
  "inline-flex items-center gap-1 rounded-full border-0 bg-sky-500/12 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-sky-800 shadow-none backdrop-blur-md dark:bg-sky-400/14 dark:text-sky-200 dark:shadow-none"

function ChatNoTradeCard({
  reason,
  className,
}: {
  reason: string
  className?: string
}) {
  const t = useTranslations("workspace")
  const text = reason.trim()
  if (!text) return null

  return (
    <article
      className={cn(
        "mt-1.5",
        chatSignalCardClass,
        "shadow-none dark:shadow-none",
        noTradeWashClass,
        className
      )}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              chatSignalCardIconShellClass,
              "bg-amber-500/16 shadow-none supports-backdrop-filter:bg-amber-500/14 dark:bg-amber-400/20 dark:shadow-none dark:supports-backdrop-filter:bg-amber-400/16"
            )}
          >
            <PauseCircleIcon
              className="size-3.5 text-amber-700 dark:text-amber-300"
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
              {t("noTradeTitle")}
            </h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {t("noTradeSubtitle")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn(noTradeChipClass, "uppercase")}>
            <PauseCircleIcon className="size-3 shrink-0 opacity-80" aria-hidden />
            {t("noTradeBadge")}
          </span>
          <span className={capitalProtectedChipClass}>
            <ShieldCheckIcon className="size-3 shrink-0 opacity-80" aria-hidden />
            {t("noTradeCapitalProtected")}
          </span>
        </div>
      </header>

      <div className="px-4 pb-4">
        <div
          className={cn(
            chatSignalCardInsetClass,
            "rounded-2xl px-3.5 py-3 shadow-none dark:shadow-none"
          )}
        >
          <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t("noTradeReasonHeading")}
          </p>
          <p
            dir="auto"
            className="mt-2 text-[13px] leading-relaxed text-foreground/85"
          >
            {text}
          </p>
        </div>
      </div>
    </article>
  )
}

export { ChatNoTradeCard }
