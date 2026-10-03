"use client"

import * as React from "react"
import { ExternalLinkIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { GoogleGlyph } from "@/components/auth/google-glyph"
import { ExurLogo } from "@/components/brand/exur-logo"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
import { getPrivacyNoticeHref, getTermsOfServiceHref } from "@/lib/legal"
import {
  chatLoginConsentDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetConsentCheckedClass,
  chatMobileSheetConsentUncheckedClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { landingCta } from "@/lib/landing-modern-styles"
import { isStandaloneDisplay } from "@/lib/display-mode"
import { cn } from "@/lib/utils"

type LoginConsentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  confirming?: boolean
}

function LegalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-colors hover:decoration-foreground/55"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
      <ExternalLinkIcon className="size-3 opacity-50" aria-hidden />
    </a>
  )
}

function ConsentCheck({
  id,
  checked,
  onCheckedChange,
  children,
}: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: React.ReactNode
}) {
  const labelId = `${id}-label`

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl py-3 ps-5 pe-3.5 text-start transition-[background-color,box-shadow]",
        checked
          ? chatMobileSheetConsentCheckedClass
          : chatMobileSheetConsentUncheckedClass
      )}
    >
      <span
        id={labelId}
        className="min-w-0 flex-1 text-[13px] leading-snug tracking-[-0.01em] text-foreground"
      >
        {children}
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
        className={cn(
          "shrink-0",
          checked &&
            "bg-[#2563EB] hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB]/40"
        )}
      />
    </label>
  )
}

function LoginConsentLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "chat-ios26-liquid-glass relative isolate flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75)] backdrop-blur-md dark:bg-white/12",
        className
      )}
    >
      <ExurLogo decorative variant="mark" className="size-7 text-foreground" />
    </span>
  )
}

function LoginConsentActions({
  canContinue,
  confirming,
  onConfirm,
  onCancel,
}: {
  canContinue: boolean
  confirming: boolean
  onConfirm: () => void
  onCancel: () => void
  mobile?: boolean
}) {
  const t = useTranslations("workspace")

  return (
    <div className="flex w-full flex-col gap-2.5">
      <Button
        type="button"
        className={cn(
          landingCta("primary", "md"),
          "h-12! min-h-12 w-full disabled:opacity-45"
        )}
        disabled={!canContinue}
        onClick={onConfirm}
      >
        <GoogleGlyph className="size-4 shrink-0 rtl:order-last" />
        {confirming ? t("connecting") : t("agreeContinueWithGoogle")}
      </Button>
      <Button
        type="button"
        className={cn(landingCta("secondary", "md"), "h-12! min-h-12 w-full")}
        disabled={confirming}
        onClick={onCancel}
      >
        {t("cancel")}
      </Button>
    </div>
  )
}

function LoginConsentBody({
  termsAccepted,
  privacyAccepted,
  onTermsChange,
  onPrivacyChange,
}: {
  termsAccepted: boolean
  privacyAccepted: boolean
  onTermsChange: (checked: boolean) => void
  onPrivacyChange: (checked: boolean) => void
}) {
  const t = useTranslations("workspace")
  const [showPwaHint] = React.useState(() =>
    typeof window !== "undefined" ? isStandaloneDisplay() : false
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <ConsentCheck
          id="accept-terms"
          checked={termsAccepted}
          onCheckedChange={onTermsChange}
        >
          {t.rich("agreeTerms", {
            link: (chunks) => (
              <LegalLink href={getTermsOfServiceHref()}>{chunks}</LegalLink>
            ),
          })}
        </ConsentCheck>
        <ConsentCheck
          id="accept-privacy"
          checked={privacyAccepted}
          onCheckedChange={onPrivacyChange}
        >
          {t.rich("agreePrivacy", {
            link: (chunks) => (
              <LegalLink href={getPrivacyNoticeHref()}>{chunks}</LegalLink>
            ),
          })}
        </ConsentCheck>
      </div>

      <p className="px-4 text-[11.5px] leading-relaxed text-pretty text-muted-foreground">
        {t("loginConsentDisclaimer")}
      </p>
      {showPwaHint ? (
        <p className="px-4 text-[11.5px] leading-relaxed text-pretty text-muted-foreground">
          {t("loginConsentPwaHint")}
        </p>
      ) : null}
    </div>
  )
}

function LoginConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  confirming = false,
}: LoginConsentDialogProps) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false)

  const canContinue = termsAccepted && privacyAccepted && !confirming

  function resetAndClose() {
    setTermsAccepted(false)
    setPrivacyAccepted(false)
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTermsAccepted(false)
      setPrivacyAccepted(false)
    }
    onOpenChange(next)
  }

  if (isDesktop === null) return null

  const actions = (
    <LoginConsentActions
      canContinue={canContinue}
      confirming={confirming}
      onConfirm={onConfirm}
      onCancel={resetAndClose}
    />
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={chatLoginConsentDialogClass}
          showCloseButton={!confirming}
        >
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
            <DialogHeader className="gap-3 space-y-0 text-start">
              <div className="flex items-center gap-3 pe-8">
                <LoginConsentLogo />
                <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                  {t("continueWithGoogle")}
                </DialogTitle>
              </div>
              <DialogDescription className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
                {t("loginConsentDescription")}
              </DialogDescription>
            </DialogHeader>
            <LoginConsentBody
              termsAccepted={termsAccepted}
              privacyAccepted={privacyAccepted}
              onTermsChange={setTermsAccepted}
              onPrivacyChange={setPrivacyAccepted}
            />
          </div>
          <DialogFooter className="mx-0 mb-0 flex-col gap-2 rounded-none border-0 bg-transparent p-4 pt-5 sm:flex-col sm:justify-stretch">
            {actions}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={!confirming}
        className={cn(chatMobileSheetContentClass, "gap-0 border-0")}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <div className={cn(chatMobileSheetBodyClass, "gap-4 pb-5")}>
          <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-3")}>
            <div className="flex items-center gap-3 pe-8">
              <LoginConsentLogo />
              <SheetTitle className={chatMobileSheetTitleClass}>
                {t("continueWithGoogle")}
              </SheetTitle>
            </div>
            <SheetDescription className={chatMobileSheetDescriptionClass}>
              {t("loginConsentDescription")}
            </SheetDescription>
          </SheetHeader>
          <LoginConsentBody
            termsAccepted={termsAccepted}
            privacyAccepted={privacyAccepted}
            onTermsChange={setTermsAccepted}
            onPrivacyChange={setPrivacyAccepted}
          />
        </div>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-4")}>{actions}</div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { LoginConsentDialog }
