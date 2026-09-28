"use client"

import * as React from "react"
import {
  ArrowUpFromLineIcon,
  CheckIcon,
  SmartphoneIcon,
  SquarePlusIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatLoginConsentBrandMarkClass,
  chatLoginConsentDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetGhostButtonClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetTitleClass,
  chatSignalCardIconShellClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ExurLogo } from "@/components/brand/exur-logo"
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
  "relative isolate overflow-hidden border-0 bg-white/82 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_16px_48px_-18px_color-mix(in_oklch,var(--foreground)_16%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(37,99,235,0.12),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.06),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.5)_0%,transparent_42%)] before:content-[''] dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_16px_48px_-18px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07] dark:before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(96,165,250,0.14),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"

const stepIconShellClass = cn(
  chatSignalCardIconShellClass,
  "size-9 bg-[#2563EB]/12 text-[#2563EB] shadow-none supports-backdrop-filter:bg-[#2563EB]/10 dark:bg-[#2563EB]/22 dark:text-[#93C5FD] dark:shadow-none dark:supports-backdrop-filter:bg-[#2563EB]/18"
)

function InstallBrandMark({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pe-2">
      <span className={chatLoginConsentBrandMarkClass}>
        <ExurLogo
          decorative
          variant="brand"
          shimmer
          className="size-7"
          imageClassName="size-[72%]"
        />
      </span>
      <div className="min-w-0 text-start">
        <p className="text-[15px] leading-none font-semibold tracking-[-0.02em] text-foreground">
          Exur
        </p>
        <p className="mt-1.5 text-[12px] leading-none text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function IosInstallSteps() {
  const t = useTranslations("workspace")

  const steps = [
    {
      icon: ArrowUpFromLineIcon,
      label: t("installIosStepShare"),
    },
    {
      icon: SquarePlusIcon,
      label: t("installIosStepAdd"),
    },
    {
      icon: CheckIcon,
      label: t("installIosStepConfirm"),
    },
  ] as const

  return (
    <ol className="flex flex-col gap-2.5 text-start">
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <li
            key={step.label}
            className={cn(
              chatMobileSheetCardClass,
              "relative flex items-start gap-3 shadow-none dark:shadow-none"
            )}
          >
            <span className={stepIconShellClass}>
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[11px] font-medium tracking-[0.08em] text-[#2563EB]/80 uppercase dark:text-[#93C5FD]/80">
                {index + 1}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug font-medium tracking-[-0.01em] text-foreground">
                {step.label}
              </p>
            </div>
          </li>
        )
      })}
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
          <DialogHeader className="gap-3 px-5 pt-5 pb-2 text-start">
            <InstallBrandMark subtitle={t("addToHomeScreen")} />
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
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-3")}>
          <InstallBrandMark subtitle={t("addToHomeScreen")} />
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
    return () => {
      window.clearTimeout(timer)
    }
  }, [visible])

  if (!visible || !ready || isDesktop === null) return null

  const title = needsManualInstall ? t("addToHomeScreen") : t("installApp")
  const description = needsManualInstall
    ? t("installNudgeIosDescription")
    : t("installNudgeDescription")
  const actionLabel = needsManualInstall
    ? t("installShowHow")
    : t("installApp")
  const brandSubtitle = needsManualInstall
    ? t("addToHomeScreen")
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
        <InstallBrandMark subtitle={brandSubtitle} />
        <p
          id="pwa-install-title"
          className="mt-4 text-[15px] font-semibold tracking-[-0.02em] text-foreground"
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
            className={cn(landingCta("primary", "md"), "h-11 w-full gap-2")}
            onClick={onInstall}
          >
            <SmartphoneIcon className="size-4 opacity-90" aria-hidden />
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
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-3")}>
          <InstallBrandMark subtitle={brandSubtitle} />
          <SheetTitle className={chatMobileSheetTitleClass}>{title}</SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {description}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div
            className={cn(chatMobileSheetFooterBarClass, "flex flex-col gap-2")}
          >
            <Button
              type="button"
              className={cn(chatMobileSheetPrimaryButtonClass, "gap-2")}
              onClick={onInstall}
            >
              <SmartphoneIcon className="size-4 opacity-90" aria-hidden />
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
