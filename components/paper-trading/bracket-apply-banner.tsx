"use client"

import * as React from "react"
import { SparklesIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CopilotPendingBracketApplyInput } from "@/lib/paper-trading/copilot-client"
import { formatTradingPrice } from "@/lib/trading/format"
import { cn } from "@/lib/utils"

type BracketApplyBannerProps = {
  pending: CopilotPendingBracketApplyInput | null
  onApply: () => void
  onDismiss: () => void
  className?: string
}

function BracketApplyBanner({
  pending,
  onApply,
  onDismiss,
  className,
}: BracketApplyBannerProps) {
  if (!pending) return null

  return (
    <div
      className={cn(
        "pointer-events-auto absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">
            IRIS suggests bracket update · {pending.symbol}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {pending.stopLoss != null
              ? `SL ${formatTradingPrice(pending.stopLoss)}`
              : "SL —"}
            {" · "}
            {pending.takeProfit != null
              ? `TP ${formatTradingPrice(pending.takeProfit)}`
              : "TP —"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button type="button" size="sm" className="h-8 text-xs" onClick={onApply}>
          Apply
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground"
          aria-label="Dismiss bracket suggestion"
          onClick={onDismiss}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export { BracketApplyBanner }
