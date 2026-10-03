"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
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
    <div className="space-y-2 text-start">
      <p className="font-heading text-[22px] font-normal tracking-tight text-foreground">
        {title}
      </p>
      <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )

  const dismiss = (
    <Button
      type="button"
      className={chatMobileSheetSecondaryButtonClass}
      onClick={() => onOpenChange(false)}
    >
      {t("composerPremiumToolsDismiss")}
    </Button>
  )

  const upgrade = (
    <a
      href={UPGRADE_PATH}
      target="_blank"
      rel="noopener noreferrer"
      className={chatMobileSheetPrimaryButtonClass}
      onClick={() => onOpenChange(false)}
    >
      {t("composerPremiumToolsCta")}
    </a>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={chatDesktopDialogClass} showCloseButton>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{body}</DialogDescription>
          <div className="px-5 pt-5 pb-1">{copy}</div>
          <DialogFooter
            className={cn(
              chatDesktopDialogFooterClass,
              "flex-col gap-2 sm:flex-col sm:justify-stretch"
            )}
          >
            {comingSoon ? dismiss : upgrade}
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
            {comingSoon ? dismiss : upgrade}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ComposerPremiumToolsDialog }
