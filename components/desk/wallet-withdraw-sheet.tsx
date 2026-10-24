"use client"

import * as React from "react"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { useMockWithdrawFlow } from "@/lib/desk-mock/hooks"

type WalletWithdrawSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableUsd: number
}

function WithdrawBody({
  availableUsd,
  onClose,
}: {
  availableUsd: number
  onClose: () => void
}) {
  const t = useTranslations("deskProfile")
  const { status, submit, reset } = useMockWithdrawFlow()
  const [amount, setAmount] = React.useState("250")
  const [address, setAddress] = React.useState("")

  React.useEffect(() => {
    return () => reset()
  }, [reset])

  if (status === "submitted") {
    return (
      <div className="flex flex-col items-center gap-3 px-1 py-6 text-center">
        <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium">{t("withdrawSubmitted")}</p>
        <p className="text-[13px] text-muted-foreground">
          {t("withdrawSubmittedHint")}
        </p>
        <Button
          type="button"
          className="mt-2"
          onClick={() => {
            reset()
            onClose()
          }}
        >
          {t("done")}
        </Button>
      </div>
    )
  }

  const amountNum = Number(amount)
  const valid =
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    amountNum <= availableUsd &&
    address.trim().length >= 10

  return (
    <div className="flex flex-col gap-4 px-1 pb-2">
      <p className="text-sm text-muted-foreground">{t("withdrawIntro")}</p>
      <div>
        <label className="mb-1.5 block text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {t("withdrawAmount")}
        </label>
        <Input
          type="number"
          min={1}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-12 rounded-2xl"
        />
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          {t("withdrawAvailable", {
            amount: availableUsd.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          })}
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {t("withdrawAddress")}
        </label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x…"
          className="h-12 rounded-2xl font-mono text-sm"
        />
      </div>
      <Button
        type="button"
        disabled={!valid || status === "submitting"}
        onClick={() => submit(amountNum, address.trim())}
      >
        {status === "submitting" ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            {t("withdrawSubmitting")}
          </>
        ) : (
          t("withdrawSubmit")
        )}
      </Button>
    </div>
  )
}

function WalletWithdrawSheet({
  open,
  onOpenChange,
  availableUsd,
}: WalletWithdrawSheetProps) {
  const t = useTranslations("deskProfile")
  const isDesktop = useIsDesktop()
  const title = t("withdrawTitle")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-[1.75rem] border-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-5">
            <WithdrawBody
              availableUsd={availableUsd}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="gap-0 overflow-hidden rounded-t-[28px] border-0 p-0"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/15" />
        <SheetHeader className="px-5 pt-3 pb-2">
          <SheetTitle className="text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <WithdrawBody
            availableUsd={availableUsd}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { WalletWithdrawSheet }
