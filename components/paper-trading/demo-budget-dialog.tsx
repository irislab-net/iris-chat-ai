"use client"

import * as React from "react"
import { WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PAPER_AI_RISK_FRACTION,
  paperRiskAmountUsd,
} from "@/lib/iris-paper-trade/size"
import {
  PAPER_MAX_BUDGET,
  PAPER_MIN_BUDGET,
  setPaperBudget,
} from "@/lib/paper-trading"
import { formatTradingPrice } from "@/lib/trading/format"
import { cn } from "@/lib/utils"

const PRESETS = [100, 500, 1_000, 10_000, 100_000] as const

type DemoBudgetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBudget: number
  hasOpenActivity: boolean
}

function budgetErrorMessage(code: string): string {
  switch (code) {
    case "BUDGET_TOO_LOW":
      return `Minimum demo budget is $${PAPER_MIN_BUDGET}.`
    case "BUDGET_TOO_HIGH":
      return `Maximum demo budget is $${formatTradingPrice(PAPER_MAX_BUDGET)}.`
    default:
      return "Enter a valid budget amount."
  }
}

function DemoBudgetDialog({
  open,
  onOpenChange,
  currentBudget,
  hasOpenActivity,
}: DemoBudgetDialogProps) {
  const [amount, setAmount] = React.useState(String(currentBudget))
  const [error, setError] = React.useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (next) {
      setAmount(String(currentBudget))
      setError(null)
    }
    onOpenChange(next)
  }

  const parsed = Number(amount.replace(/,/g, ""))
  const previewRisk =
    Number.isFinite(parsed) && parsed > 0
      ? paperRiskAmountUsd(parsed)
      : null

  function applyBudget(next: number) {
    const result = setPaperBudget(next)
    if (!result.ok) {
      setError(budgetErrorMessage(result.error))
      return
    }
    onOpenChange(false)
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    applyBudget(parsed)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="space-y-1 border-b border-border/60 px-4 py-3 text-left">
          <DialogTitle className="flex items-center gap-2 text-base tracking-tight">
            <WalletIcon className="size-4 text-muted-foreground" />
            Demo budget
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Set your paper trading capital. IRIS sizes signals at{" "}
            {(PAPER_AI_RISK_FRACTION * 100).toFixed(1)}% of equity per trade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 px-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="demo-budget" className="text-xs">
              Starting balance (USDC)
            </Label>
            <Input
              id="demo-budget"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setError(null)
              }}
              placeholder="100"
              aria-invalid={error != null}
            />
            {previewRisk != null ? (
              <p className="text-[11px] text-muted-foreground">
                Risk per IRIS signal: ~$
                {previewRisk.toFixed(2)} USDC
              </p>
            ) : null}
            {error ? (
              <p className="text-[11px] text-destructive">{error}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="xs"
                variant={parsed === preset ? "secondary" : "outline"}
                className={cn("font-mono tabular-nums")}
                onClick={() => {
                  setAmount(String(preset))
                  setError(null)
                }}
              >
                ${formatTradingPrice(preset)}
              </Button>
            ))}
          </div>

          {hasOpenActivity ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              Changing budget resets your demo account and closes all open
              positions and orders.
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Apply budget
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { DemoBudgetDialog }
