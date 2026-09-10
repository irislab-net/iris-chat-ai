"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { ChatClientActionSummary } from "@/lib/chat/client-tools"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import type { PendingBracketApply } from "@/lib/chat-storage"
import {
  dispatchCopilotGhostTrade,
  fillSignalToOrder,
} from "@/lib/paper-trading/copilot-client"
import { formatTradingPrice, formatTradingQty } from "@/lib/trading/format"
import { cn } from "@/lib/utils"

type ChatActionCardProps = {
  paperTicket?: PaperTradeTicket
  pendingBracket?: PendingBracketApply
  clientActions?: ChatClientActionSummary[]
  disabled?: boolean
  onApplyBracket?: (requestId: string) => void
  onDismissBracket?: (requestId: string) => void
  className?: string
}

function ChatActionCard({
  paperTicket,
  pendingBracket,
  clientActions: _clientActions,
  disabled,
  onApplyBracket,
  onDismissBracket,
  className,
}: ChatActionCardProps) {
  const t = useTranslations("workspace")
  const hasSignal = Boolean(paperTicket)
  const hasBracket = Boolean(pendingBracket)

  if (!hasSignal && !hasBracket) return null

  return (
    <div
      className={cn(
        "mt-2 space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3",
        className
      )}
    >
      {paperTicket ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-foreground">
                {t("signalCardTitle")} ·{" "}
                {paperTicket.side === "LONG" ? "Long" : "Short"}{" "}
                {paperTicket.symbol}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("signalCardSize")}{" "}
                {formatTradingQty(paperTicket.quantity)} · Entry ~{" "}
                {formatTradingPrice(paperTicket.markPrice)} · SL{" "}
                {formatTradingPrice(paperTicket.stopLoss)} · TP{" "}
                {formatTradingPrice(paperTicket.takeProfit)} ·{" "}
                {paperTicket.leverage}x
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            className="h-9 w-full text-xs sm:w-auto sm:min-w-44"
            onClick={() => {
              dispatchCopilotGhostTrade({
                id: `signal:${paperTicket.symbol}:${Date.now()}`,
                symbol: paperTicket.symbol,
                side: paperTicket.side,
                entryPrice: paperTicket.markPrice,
                quantity: paperTicket.quantity,
                stopLoss: paperTicket.stopLoss,
                takeProfit: paperTicket.takeProfit,
                label: t("signalCardTitle"),
                clearPrevious: true,
              })
              fillSignalToOrder({
                side: paperTicket.side,
                symbol: paperTicket.symbol,
                quantity: paperTicket.quantity,
                stopLoss: paperTicket.stopLoss,
                takeProfit: paperTicket.takeProfit,
                leverage: paperTicket.leverage,
              })
            }}
          >
            {t("fillOrderFromSignal")}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            {t("fillOrderHint")}
          </p>
        </div>
      ) : null}

      {pendingBracket ? (
        <div className="space-y-2 border-t border-border/40 pt-2">
          <p className="text-xs font-medium text-foreground">
            Apply bracket update · {pendingBracket.symbol}{" "}
            {pendingBracket.side}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {pendingBracket.stopLoss != null
              ? `SL ${formatTradingPrice(pendingBracket.stopLoss)}`
              : "SL unchanged"}
            {" · "}
            {pendingBracket.takeProfit != null
              ? `TP ${formatTradingPrice(pendingBracket.takeProfit)}`
              : "TP unchanged"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              className="h-8 text-xs"
              onClick={() => onApplyBracket?.(pendingBracket.requestId)}
            >
              Apply brackets
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              className="h-8 text-xs"
              onClick={() => onDismissBracket?.(pendingBracket.requestId)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { ChatActionCard }
