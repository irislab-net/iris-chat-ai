"use client"

import { ArrowRightIcon, CandlestickChartIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { requestOpenPaperTrading } from "@/lib/paper-trading/open-request"
import { cn } from "@/lib/utils"

function prefetchPaperTrading() {
  void import("@/components/paper-trading/paper-trading-workspace")
}

function TryPaperTradingButton({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="sm"
            className={cn(
              "h-8 gap-2 rounded-full shadow-none sm:h-9 px-4!",
              className
            )}
            data-tour="paper"
            aria-label="Try paper trading"
            onPointerEnter={prefetchPaperTrading}
            onFocus={prefetchPaperTrading}
            onClick={() => requestOpenPaperTrading()}
          />
        }
      >
        <CandlestickChartIcon data-icon="inline-start" />
        <span>Try Paper Trading</span>
        <ArrowRightIcon
          data-icon="inline-end"
          className="size-3.5 transition-transform group-hover/button:translate-x-0.5"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Practice with live prices. No real money.
      </TooltipContent>
    </Tooltip>
  )
}

export { TryPaperTradingButton }
