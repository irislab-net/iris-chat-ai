"use client"

import * as React from "react"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
import { DepositAddressCard } from "@/components/billing/deposit-address-card"
import { PaymentMethodPicker } from "@/components/billing/payment-method-picker"
import { Button } from "@/components/ui/button"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { useMockDepositFlow } from "@/lib/desk-mock/hooks"
import {
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function DepositWatchStatus({ confirming }: { confirming: boolean }) {
  const t = useTranslations("deskProfile")

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        landingGlassSurface,
        "relative flex items-center gap-3 rounded-2xl bg-white/55 px-3.5 py-3 dark:bg-white/10"
      )}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
      <span
        className={cn(
          "relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          confirming
            ? "bg-[#2563EB]/15 text-[#1D4ED8] dark:bg-[#2563EB]/25 dark:text-[#93C5FD]"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        )}
        aria-hidden
      >
        <Loader2Icon className="size-4 animate-spin" />
      </span>
      <p className="relative z-10 min-w-0 text-[13px] font-semibold tracking-tight text-foreground">
        {confirming ? t("depositConfirming") : t("depositWaiting")}
      </p>
    </div>
  )
}

type WalletDepositSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DepositBody({
  onClose,
  footerClassName,
}: {
  onClose: () => void
  footerClassName?: string
}) {
  const t = useTranslations("deskProfile")
  const { invoice, startDeposit, markPaid } = useMockDepositFlow("USDT")
  const [currency, setCurrency] = React.useState<PaymentCurrency>("USDT")

  const paid = invoice?.status === "paid"
  const confirming = invoice?.status === "confirming"
  const address = invoice?.payAddress ?? ""

  function onCurrencyChange(next: PaymentCurrency) {
    if (paid) return
    setCurrency(next)
    startDeposit(next)
  }

  return (
    <>
      <div className={cn(chatMobileSheetBodyClass, "overflow-y-auto pt-5")}>
        <div className="flex flex-col gap-4">
          {!paid ? (
            <>
              <PaymentMethodPicker
                currency={currency}
                disabled={paid}
                fullWidth
                onCurrencyChange={onCurrencyChange}
              />
              {address ? (
                <DepositAddressCard
                  address={address}
                  currency={currency}
                  compact
                />
              ) : (
                <div className="flex justify-center py-10">
                  <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium">{t("depositPaid")}</p>
            </div>
          )}
          {!paid && address ? (
            <DepositWatchStatus confirming={confirming} />
          ) : null}
        </div>
      </div>

      <div className={cn(chatMobileSheetFooterClass, "shrink-0", footerClassName)}>
        <div className={cn(chatMobileSheetFooterBarClass, "pt-3 pb-0")}>
          {!paid ? (
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              disabled={!address}
              onClick={markPaid}
            >
              {t("depositIvePaid")}
            </Button>
          ) : (
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              onClick={onClose}
            >
              {t("done")}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

function WalletDepositSheet({ open, onOpenChange }: WalletDepositSheetProps) {
  const t = useTranslations("deskProfile")
  const isDesktop = useIsDesktop()
  const title = t("depositTitle")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "max-h-[min(85dvh,40rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
          )}
        >
          <DialogHeader className={cn(chatMobileSheetHeaderClass, "px-5 pt-5")}>
            <DialogTitle className={chatMobileSheetTitleClass}>{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("depositIntro")}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <DepositBody
              onClose={() => onOpenChange(false)}
              footerClassName="pb-2"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={chatMobileSheetCompactContentClass}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 pe-5")}>
          <div className="flex items-center gap-2">
            <SheetTitle className={cn(chatMobileSheetTitleClass, "min-w-0 flex-1")}>
              {title}
            </SheetTitle>
            <ChatSheetDoneCheck onClick={() => onOpenChange(false)} />
          </div>
          <SheetDescription className="sr-only">
            {t("depositIntro")}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <DepositBody onClose={() => onOpenChange(false)} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export { WalletDepositSheet }
