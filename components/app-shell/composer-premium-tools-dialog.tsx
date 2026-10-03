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
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
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
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { landingCta } from "@/lib/landing-modern-styles"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

type ComposerPremiumToolsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Plus users see a coming-soon notice instead of the upgrade pitch. */
  isProUser?: boolean
  /** Locked feature that opened the dialog — upload is always coming-soon. */
  feature?: "premium-tools" | "upload" | "watchlist"
}

function ShimmerTokenMark({ currency }: { currency: "USDT" | "USDC" }) {
  return (
    <span className="relative isolate inline-flex shrink-0 overflow-hidden rounded-full">
      <PaymentTokenLogo
        currency={currency}
        size="sm"
        className="ring-2 ring-background"
      />
      <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]">
        <span
          className={cn(
            "absolute inset-y-[-12%] left-0 w-[62%]",
            "bg-linear-to-r from-transparent via-white/55 to-transparent",
            "animate-exur-logo-shimmer will-change-transform",
            "dark:via-white/70"
          )}
        />
      </span>
    </span>
  )
}

function ComposerPremiumToolsDialog({
  open,
  onOpenChange,
  isProUser = false,
  feature = "premium-tools",
}: ComposerPremiumToolsDialogProps) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()

  if (isDesktop === null) return null

  const comingSoon = isProUser || feature === "upload"
  const title = comingSoon
    ? t("composerPremiumToolsComingSoonTitle")
    : t("composerPremiumToolsTitle")
  const body =
    feature === "upload"
      ? t("composerToolUploadComingSoonBody")
      : feature === "watchlist"
        ? comingSoon
          ? t("composerToolWatchlistComingSoonBody")
          : t("composerToolWatchlistBody")
        : comingSoon
          ? t("composerPremiumToolsComingSoonBody")
          : t("composerPremiumToolsBody")

  const copy = (
    <div className="space-y-3 text-start">
      <div className="space-y-2">
        <p className={chatMobileSheetTitleClass}>{title}</p>
        <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      {!comingSoon ? (
        <div
          className={cn(
            chatMobileSheetCardClass,
            "flex items-center gap-3 py-3"
          )}
        >
          <span className="flex items-center -space-x-1.5" aria-hidden>
            <ShimmerTokenMark currency="USDT" />
            <ShimmerTokenMark currency="USDC" />
          </span>
          <p className="min-w-0 text-[13px] leading-snug text-muted-foreground">
            {t("composerPremiumToolsPaymentNote")}
          </p>
        </div>
      ) : null}
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={chatDesktopDialogClass}
          showCloseButton
          gsapMotion
          open={open}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{body}</DialogDescription>
          <div className="px-5 pt-5 pb-1">{copy}</div>
          <DialogFooter
            className={cn(
              chatDesktopDialogFooterClass,
              "flex-col gap-2 sm:flex-col sm:justify-stretch"
            )}
          >
            {comingSoon ? (
              <Button
                type="button"
                className={cn(landingCta("secondary", "sm"), "rounded-full")}
                onClick={() => onOpenChange(false)}
              >
                {t("composerPremiumToolsDismiss")}
              </Button>
            ) : (
              <Button
                type="button"
                className={cn(landingCta("primary", "sm"), "rounded-full")}
                nativeButton={false}
                render={<Link href={UPGRADE_PATH} />}
                onClick={() => onOpenChange(false)}
              >
                {t("composerPremiumToolsCta")}
              </Button>
            )}
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
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{body}</SheetDescription>
        <div className={cn(chatMobileSheetBodyClass, "pt-1 pb-2")}>{copy}</div>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-4")}>
            {comingSoon ? (
              <Button
                type="button"
                className={chatMobileSheetSecondaryButtonClass}
                onClick={() => onOpenChange(false)}
              >
                {t("composerPremiumToolsDismiss")}
              </Button>
            ) : (
              <Button
                type="button"
                className={chatMobileSheetPrimaryButtonClass}
                nativeButton={false}
                render={<Link href={UPGRADE_PATH} />}
                onClick={() => onOpenChange(false)}
              >
                {t("composerPremiumToolsCta")}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ComposerPremiumToolsDialog }
