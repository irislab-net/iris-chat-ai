"use client"

import * as React from "react"
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
import { usePwaNudgeReveal } from "@/hooks/use-banner-timing"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const nudgeSurfaceClass =
  "relative isolate overflow-hidden border-0 bg-white/82 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_16px_48px_-18px_color-mix(in_oklch,var(--foreground)_16%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(37,99,235,0.12),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.06),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.5)_0%,transparent_42%)] before:content-[''] dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_16px_48px_-18px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07] dark:before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(96,165,250,0.14),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"

/** iOS SF Symbol–like: square.and.arrow.up (Share). */
function IosShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 3.25v10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.4 6.6 12 3.1l3.6 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.25 11.5v6.25A2.5 2.5 0 0 0 7.75 20.25h8.5a2.5 2.5 0 0 0 2.5-2.5V11.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** iOS SF Symbol–like: plus.square (Add to Home Screen). */
function IosAddHomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="4.25"
        y="4.25"
        width="15.5"
        height="15.5"
        rx="3.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8.25v7.5M8.25 12h7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** iOS SF Symbol–like: checkmark.circle. */
function IosCheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="8.1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m8.6 12.15 2.35 2.35 4.45-4.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const iosStepIconClass = "size-5 shrink-0 text-foreground"

/** Mark on white plate — install sheets header. */
function InstallHeaderLogo({ className }: { className?: string }) {
  return (
    <ExurLogo
      decorative
      variant="mark"
      className={cn(
        "size-10 shrink-0 overflow-hidden rounded-full bg-white text-black",
        className
      )}
    />
  )
}

function IosStepIconBadge({
  animation,
  delayMs = 0,
  children,
}: {
  animation: "share" | "add" | "check"
  delayMs?: number
  children: React.ReactNode
}) {
  const motionClass =
    animation === "share"
      ? "animate-ios-step-icon-share"
      : animation === "add"
        ? "animate-ios-step-icon-add"
        : "animate-ios-step-icon-check"

  return (
    <span
      className={cn(
        chatLoginConsentBrandMarkClass,
        "relative isolate size-10 shrink-0"
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-full bg-linear-to-br from-white/95 via-white/30 to-transparent dark:from-white/12 dark:via-white/3 dark:to-transparent"
      />
      <span
        className={cn("relative z-10 inline-flex", motionClass)}
        style={{ animationDelay: `${delayMs}ms` }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
      >
        <span
          className={cn(
            "absolute inset-y-[-12%] left-0 w-[62%]",
            "bg-linear-to-r from-transparent via-white/55 to-transparent",
            "animate-exur-logo-shimmer will-change-transform",
            "dark:via-white/70"
          )}
          style={{ animationDelay: `${delayMs + 200}ms` }}
        />
      </span>
    </span>
  )
}

function IosInstallSteps() {
  const t = useTranslations("workspace")

  const steps = [
    {
      icon: IosShareIcon,
      animation: "share" as const,
      delayMs: 0,
      label: t("installIosStepShare"),
    },
    {
      icon: IosAddHomeIcon,
      animation: "add" as const,
      delayMs: 280,
      label: t("installIosStepAdd"),
    },
    {
      icon: IosCheckCircleIcon,
      animation: "check" as const,
      delayMs: 560,
      label: t("installIosStepConfirm"),
    },
  ] as const

  return (
    <ol className="flex flex-col gap-2 text-start">
      {steps.map((step) => {
        const Icon = step.icon
        return (
          <li
            key={step.label}
            className={cn(
              chatMobileSheetCardClass,
              "flex items-center gap-3 shadow-none dark:shadow-none"
            )}
          >
            <IosStepIconBadge
              animation={step.animation}
              delayMs={step.delayMs}
            >
              <Icon className={iosStepIconClass} />
            </IosStepIconBadge>
            <p className="min-w-0 flex-1 text-sm leading-snug font-light tracking-[-0.015em] text-foreground">
              {step.label}
            </p>
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
            <div className="flex items-center gap-3 pe-2">
              <InstallHeaderLogo />
              <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                {t("installIosTitle")}
              </DialogTitle>
            </div>
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
          <div className="flex items-center gap-3 pe-2">
            <InstallHeaderLogo />
            <SheetTitle className={chatMobileSheetTitleClass}>
              {t("installIosTitle")}
            </SheetTitle>
          </div>
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
  forcePreview = false,
}: {
  visible: boolean
  needsManualInstall: boolean
  onInstall: () => void
  onDismiss: () => void
  forcePreview?: boolean
}) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()
  // Consent-gated + engagement dwell / first input — never cold-prompt on paint.
  const timingReady = usePwaNudgeReveal(visible && !forcePreview)
  const showNudgeUi = forcePreview || (visible && timingReady)

  if (!showNudgeUi || isDesktop === null) return null

  const title = needsManualInstall ? t("addToHomeScreen") : t("installApp")
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
        <div className="flex items-center gap-3">
          <InstallHeaderLogo />
          <p
            id="pwa-install-title"
            className="font-heading text-[1.25rem] font-normal tracking-tight text-foreground"
          >
            {title}
          </p>
        </div>
        <p
          id="pwa-install-desc"
          className="mt-3 text-[13px] leading-relaxed text-muted-foreground"
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
            className="h-10 w-full rounded-full text-sm text-muted-foreground"
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
      open={showNudgeUi}
      onOpenChange={(open) => {
        if (!open && !forcePreview) onDismiss()
      }}
    >
      <SheetContent side="bottom" className={chatMobileSheetContentClass}>
        <div className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-3")}>
          <div className="flex items-center gap-3 pe-2">
            <InstallHeaderLogo />
            <SheetTitle className={chatMobileSheetTitleClass}>{title}</SheetTitle>
          </div>
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
              className={cn(chatMobileSheetPrimaryButtonClass)}
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
