"use client"

import * as React from "react"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"

import { DepositAddressCard } from "@/components/billing/deposit-address-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { formatUsd } from "@/lib/desk-mock/format"
import { useMockDepositFlow } from "@/lib/desk-mock/hooks"
import {
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const AMOUNTS = [250, 500, 1000, 2500] as const

type WalletDepositSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DepositBody({
  onClose,
}: {
  onClose: () => void
}) {
  const t = useTranslations("deskProfile")
  const { invoice, startDeposit, markPaid, reset } = useMockDepositFlow()
  const [amount, setAmount] = React.useState<number>(500)
  const [currency, setCurrency] = React.useState<"USDT" | "USDC">("USDT")

  React.useEffect(() => {
    return () => reset()
  }, [reset])

  if (invoice) {
    const paid = invoice.status === "paid"
    const confirming = invoice.status === "confirming"
    return (
      <div className="flex flex-col gap-4 px-1 pb-2">
        <div
          className={cn(
            landingGlassSurface,
            "relative rounded-2xl bg-white/48 p-4 dark:bg-white/10"
          )}
        >
          <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
          <div className="relative z-10 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                {t("depositAmount")}
              </p>
              <p className="mt-1 text-2xl tracking-[-0.02em] tabular-nums">
                {formatUsd(invoice.amountUsd)}
              </p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {invoice.currency}
            </p>
          </div>
        </div>

        {!paid ? (
          <DepositAddressCard
            address={invoice.payAddress}
            currency={invoice.currency}
            compact
          />
        ) : null}

        <div className="flex flex-col items-center gap-2 py-2 text-center">
          {paid ? (
            <>
              <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium">{t("depositPaid")}</p>
            </>
          ) : (
            <>
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {confirming
                  ? t("depositConfirming")
                  : t("depositWaiting")}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {t("depositNowPaymentsHint")}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!paid ? (
            <Button type="button" onClick={markPaid}>
              {t("depositIvePaid")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                reset()
                onClose()
              }}
            >
              {t("done")}
            </Button>
          )}
          {!paid ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset()
              }}
            >
              {t("depositBack")}
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-1 pb-2">
      <p className="text-sm text-muted-foreground">{t("depositIntro")}</p>

      <div>
        <p className="mb-2 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {t("depositAmount")}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={cn(
                "rounded-2xl px-2 py-2.5 text-sm font-medium tabular-nums transition-colors",
                amount === a
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-foreground hover:bg-muted"
              )}
            >
              ${a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {t("depositCurrency")}
        </p>
        <div className="flex gap-2">
          {(["USDT", "USDC"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "flex-1 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                currency === c
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-foreground hover:bg-muted"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        className="mt-1"
        onClick={() => startDeposit(amount, currency)}
      >
        {t("depositContinue")}
      </Button>
    </div>
  )
}

function WalletDepositSheet({ open, onOpenChange }: WalletDepositSheetProps) {
  const t = useTranslations("deskProfile")
  const isDesktop = useIsDesktop()

  const title = t("depositTitle")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-[1.75rem] border-0 p-0 sm:max-w-md">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
            <DepositBody onClose={() => onOpenChange(false)} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] gap-0 overflow-hidden rounded-t-[28px] border-0 p-0"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/15" />
        <SheetHeader className="px-5 pt-3 pb-2">
          <SheetTitle className="text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="max-h-[calc(92dvh-4.5rem)] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DepositBody onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { WalletDepositSheet }
