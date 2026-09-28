"use client"

import * as React from "react"
import { ShareIcon, SquarePlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatLoginConsentDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetGhostButtonClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetTitleClass,
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
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { getStoredConsent } from "@/lib/consent"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const nudgeSurfaceClass =
  "border-0 bg-white/82 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_16px_48px_-18px_color-mix(in_oklch,var(--foreground)_16%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68 dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_16px_48px_-18px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07]"

function IosInstallSteps() {
  const t = useTranslations("workspace")

  return (
    <ol className="flex flex-col gap-3 text-start">
      <li className="flex items-start gap-3 rounded-2xl bg-foreground/4 px-3.5 py-3 dark:bg-white/5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/12 text-[12px] font-semibold text-[#2563EB]">
          1
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <ShareIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
            {t("installIosStepShare")}
          </p>
        </div>
      </li>
      <li className="flex items-start gap-3 rounded-2xl bg-foreground/4 px-3.5 py-3 dark:bg-white/5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/12 text-[12px] font-semibold text-[#2563EB]">
          2
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <SquarePlusIcon
              className="size-3.5 shrink-0 opacity-70"
              aria-hidden
            />
            {t("installIosStepAdd")}
          </p>
        </div>
      </li>
      <li className="flex items-start gap-3 rounded-2xl bg-foreground/4 px-3.5 py-3 dark:bg-white/5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/12 text-[12px] font-semibold text-[#2563EB]">
          3
        </span>
        <p className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
          {t("installIosStepConfirm")}
        </p>
      </li>
    </ol>
  )
}

function PwaInstallManualGuide({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()

  if (isDesktop === null) return null

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={chatLoginConsentDialogClass}>
          <DialogHeader className="gap-2 px-5 pt-5 pb-2 text-start">
            <DialogTitle className="text-[1.05rem] tracking-[-0.02em]">
              {t("installIosTitle")}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              {t("installIosDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-2">
            <IosInstallSteps />
          </div>
          <DialogFooter className="border-0 bg-transparent px-5 pt-2 pb-5 sm:justify-stretch">
            <Button
              type="button"
              className={cn(landingCta("primary", "md"), "h-11 w-full")}
              onClick={() => onOpenChange(false)}
            >
              {t("installGotIt")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={chatMobileSheetContentClass}>
        <div className={chatMobileSheetHandleClass} />
        <SheetHeader className={chatMobileSheetHeaderClass}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("installIosTitle")}
          </SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {t("installIosDescription")}
          </SheetDescription>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "px-5 pb-2")}>
          <IosInstallSteps />
        </div>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={chatMobileSheetFooterBarClass}>
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              onClick={() => onOpenChange(false)}
            >
              {t("installGotIt")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PwaInstallNudge({
  visible,
  needsManualInstall,
  onInstall,
  onDismiss,
}: {
  visible: boolean
  needsManualInstall: boolean
  onInstall: () => void
  onDismiss: () => void
}) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (!visible) {
      setReady(false)
      return
    }
    // Wait for cookie banner to settle; avoid stacking on first paint.
    const timer = window.setTimeout(() => {
      if (getStoredConsent()) setReady(true)
    }, 2800)
    return () => window.clearTimeout(timer)
  }, [visible])

  if (!visible || !ready || isDesktop === null) return null

  const title = needsManualInstall
    ? t("addToHomeScreen")
    : t("installApp")
  const description = needsManualInstall
    ? t("installNudgeIosDescription")
    : t("installNudgeDescription")
  const actionLabel = needsManualInstall
    ? t("installShowHow")
    : t("installApp")

  if (isDesktop) {
    return (
      <aside
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-desc"
        className={cn(
          nudgeSurfaceClass,
          "fixed inset-e-4 bottom-4 z-55 w-[min(100%-2rem,22rem)] rounded-[1.5rem] p-5"
        )}
      >
        <p
          id="pwa-install-title"
          className="text-[15px] font-semibold tracking-[-0.02em] text-foreground"
        >
          {title}
        </p>
        <p
          id="pwa-install-desc"
          className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground"
        >
          {description}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            className={cn(landingCta("primary", "md"), "h-11 w-full")}
            onClick={onInstall}
          >
            {actionLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full rounded-full text-[14px] text-muted-foreground"
            onClick={onDismiss}
          >
            {t("installNotNow")}
          </Button>
        </div>
      </aside>
    )
  }

  return (
    <Sheet
      open={ready}
      onOpenChange={(open) => {
        if (!open) onDismiss()
      }}
    >
      <SheetContent side="bottom" className={chatMobileSheetContentClass}>
        <div className={chatMobileSheetHandleClass} />
        <SheetHeader className={chatMobileSheetHeaderClass}>
          <SheetTitle className={chatMobileSheetTitleClass}>{title}</SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {description}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "flex flex-col gap-2")}>
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              onClick={onInstall}
            >
              {actionLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={chatMobileSheetGhostButtonClass}
              onClick={onDismiss}
            >
              {t("installNotNow")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PwaInstallPrompt() {
  const {
    showNudge,
    needsManualInstall,
    promptInstall,
    dismissNudge,
    manualGuideOpen,
    setManualGuideOpen,
  } = usePwaInstall()

  return (
    <>
      <PwaInstallNudge
        visible={showNudge}
        needsManualInstall={needsManualInstall}
        onInstall={() => {
          void promptInstall()
        }}
        onDismiss={dismissNudge}
      />
      <PwaInstallManualGuide
        open={manualGuideOpen}
        onOpenChange={setManualGuideOpen}
      />
    </>
  )
}

export { PwaInstallPrompt }
