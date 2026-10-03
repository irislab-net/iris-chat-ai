"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"
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
  chatSignalCardIconShellClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
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
import { landingCta } from "@/lib/landing-modern-styles"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

type ComposerPremiumToolsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Plus users see a coming-soon notice instead of the upgrade pitch. */
  isProUser?: boolean
}

function PremiumHeroIcon() {
  return (
    <span
      className={cn(
        chatSignalCardIconShellClass,
        "size-12 bg-sky-500/18 text-sky-600 supports-[backdrop-filter]:bg-sky-500/16 dark:bg-sky-400/22 dark:text-sky-300 dark:supports-[backdrop-filter]:bg-sky-400/18"
      )}
    >
      <SparklesIcon className="size-5" aria-hidden />
    </span>
  )
}

function ComposerPremiumToolsDialog({
  open,
  onOpenChange,
  isProUser = false,
}: ComposerPremiumToolsDialogProps) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()

  if (isDesktop === null) return null

  const title = isProUser
    ? t("composerPremiumToolsComingSoonTitle")
    : t("composerPremiumToolsTitle")
  const body = isProUser
    ? t("composerPremiumToolsComingSoonBody")
    : t("composerPremiumToolsBody")

  const header = (
    <>
      <PremiumHeroIcon />
      {isDesktop ? (
        <DialogHeader className="gap-2 space-y-0 text-start">
          <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
            {body}
          </DialogDescription>
        </DialogHeader>
      ) : (
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-2")}>
          <SheetTitle className={chatMobileSheetTitleClass}>{title}</SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {body}
          </SheetDescription>
        </SheetHeader>
      )}
    </>
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
          <div className="flex flex-col items-start gap-4 px-5 pt-5 pb-1">
            {header}
          </div>
          <DialogFooter
            className={cn(
              chatDesktopDialogFooterClass,
              "flex-col gap-2 sm:flex-col sm:justify-stretch"
            )}
          >
            {isProUser ? (
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
        <div
          className={cn(
            chatMobileSheetBodyClass,
            "flex flex-col items-start gap-4 pt-1 pb-2"
          )}
        >
          {header}
        </div>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-4")}>
            {isProUser ? (
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
