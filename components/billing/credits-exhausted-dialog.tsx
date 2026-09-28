"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
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
import { PAYMENT_TOKENS } from "@/lib/billing/payment-options"
import { landingCta } from "@/lib/landing-modern-styles"
import { BILLING_PATH, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

type CreditsExhaustedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isProUser?: boolean
}

function CreditsExhaustedBody() {
  const t = useTranslations("workspace.creditsExhausted")

  return (
    <div className={cn(chatMobileSheetCardClass, "flex items-center gap-3")}>
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
  )
}

function CreditsExhaustedDialog({
  open,
  onOpenChange,
  isProUser = false,
}: CreditsExhaustedDialogProps) {
  const t = useTranslations("workspace.creditsExhausted")
  const tw = useTranslations("workspace")
  const isDesktop = useIsDesktop()

  if (isDesktop === null) return null

  const description = isProUser ? t("descriptionPro") : t("description")
  const primaryHref = isProUser ? BILLING_PATH : UPGRADE_PATH
  const primaryLabel = isProUser ? t("viewBilling") : tw("upgradeToPlus")
  const showBody = !isProUser

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
        render={<Link href={primaryHref} />}
        onClick={() => onOpenChange(false)}
      >
        {primaryLabel}
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
                {description}
              </DialogDescription>
            </DialogHeader>
            {showBody ? <CreditsExhaustedBody /> : null}
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
            {description}
          </SheetDescription>
        </SheetHeader>
        {showBody ? (
          <div className={cn(chatMobileSheetBodyClass, "pt-1 pb-5")}>
            <CreditsExhaustedBody />
          </div>
        ) : null}
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
