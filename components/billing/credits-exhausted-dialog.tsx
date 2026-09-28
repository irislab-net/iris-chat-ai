"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { PaymentTokenLogo } from "@/components/billing/payment-token-logo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import type { ChatCreditBalance } from "@/lib/api/types"
import {
  creditUsageFromBalance,
  formatCreditCount,
  type CreditUsagePeriod,
} from "@/lib/api/credit-usage"
import { PAYMENT_TOKENS } from "@/lib/billing/payment-options"
import { landingCta } from "@/lib/landing-modern-styles"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

type CreditsExhaustedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance?: ChatCreditBalance | null
}

function CreditPeriodRow({
  label,
  period,
}: {
  label: string
  period: CreditUsagePeriod
}) {
  const pct = Math.round(period.usedFraction * 100)
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-sm font-medium tabular-nums tracking-tight">
          {formatCreditCount(period.remaining)}
          <span className="text-muted-foreground">
            {" "}
            / {formatCreditCount(period.limit)}
          </span>
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/8 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            pct >= 90 ? "bg-destructive" : "bg-[#2563EB]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CreditsExhaustedBody({
  balance,
}: {
  balance?: ChatCreditBalance | null
}) {
  const t = useTranslations("workspace.creditsExhausted")
  const usage = balance ? creditUsageFromBalance(balance) : null

  return (
    <div className="space-y-4">
      {usage ? (
        <div className="space-y-3.5 rounded-2xl bg-foreground/4 px-3.5 py-3.5 dark:bg-white/6">
          <CreditPeriodRow label={t("daily")} period={usage.daily} />
          <CreditPeriodRow label={t("weekly")} period={usage.weekly} />
        </div>
      ) : null}

      <div className="flex items-center gap-3 rounded-2xl bg-foreground/4 px-3.5 py-3 dark:bg-white/6">
        <div className="flex -space-x-1.5">
          {PAYMENT_TOKENS.map((token) => (
            <PaymentTokenLogo
              key={token.id}
              currency={token.id}
              size="sm"
              className="ring-2 ring-background"
            />
          ))}
        </div>
        <p className="min-w-0 text-[13px] leading-snug text-muted-foreground">
          {t("payWithCrypto")}
        </p>
      </div>
    </div>
  )
}

function CreditsExhaustedDialog({
  open,
  onOpenChange,
  balance = null,
}: CreditsExhaustedDialogProps) {
  const t = useTranslations("workspace.creditsExhausted")
  const tw = useTranslations("workspace")
  const isDesktop = useIsDesktop()

  if (isDesktop === null) return null

  const actions = (
    <>
      <Button
        type="button"
        className={cn(
          isDesktop
            ? cn(landingCta("primary", "sm"), "rounded-full")
            : chatMobileSheetPrimaryButtonClass
        )}
        nativeButton={false}
        render={<Link href={UPGRADE_PATH} />}
        onClick={() => onOpenChange(false)}
      >
        {tw("upgradeToPlus")}
      </Button>
      <Button
        type="button"
        className={cn(
          isDesktop
            ? cn(landingCta("secondary", "sm"), "rounded-full")
            : chatMobileSheetSecondaryButtonClass
        )}
        onClick={() => onOpenChange(false)}
      >
        {t("notNow")}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={chatDesktopDialogClass} showCloseButton>
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
            <DialogHeader className="gap-2 space-y-0 text-start">
              <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
                {t("description")}
              </DialogDescription>
            </DialogHeader>
            <CreditsExhaustedBody balance={balance} />
          </div>
          <DialogFooter
            className={cn(
              chatDesktopDialogFooterClass,
              "flex-col gap-2 sm:flex-col sm:justify-stretch"
            )}
          >
            {actions}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className={cn(chatMobileSheetContentClass, "gap-0 border-0")}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-2")}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("title")}
          </SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {t("description")}
          </SheetDescription>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "pt-1 pb-5")}>
          <CreditsExhaustedBody balance={balance} />
        </div>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "space-y-2 pt-4")}>
            {actions}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { CreditsExhaustedDialog }
