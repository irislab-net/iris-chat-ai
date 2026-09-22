"use client"

import * as React from "react"
import { ExternalLinkIcon } from "lucide-react"

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
import { PRIVACY_NOTICE_URL, TERMS_OF_SERVICE_URL } from "@/lib/legal"
import {
  chatLoginConsentBrandMarkClass,
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
import { cn } from "@/lib/utils"

type LoginConsentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  confirming?: boolean
}

const TITLE = "Continue with Google"
const DESCRIPTION = "Accept the terms below to sign in securely."
const DISCLAIMER =
  "You must be 18+ and not located in a comprehensively sanctioned jurisdiction. Exur provides analytics for information only — not financial advice."

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
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-[background-color,box-shadow]",
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

function LoginConsentBrand() {
  return (
    <div className="flex items-center gap-3">
      <span className={chatLoginConsentBrandMarkClass}>
        <ExurLogo
          decorative
          size={28}
          className="size-7 rounded-full"
          priority
        />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-none tracking-[-0.02em] text-foreground">
          Exur
        </p>
        <p className="mt-1.5 text-[12px] leading-none text-muted-foreground">
          Secure sign-in with Google
        </p>
      </div>
    </div>
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
        <GoogleGlyph className="size-4 shrink-0" />
        {confirming ? "Connecting…" : "Agree & continue with Google"}
      </Button>
      <Button
        type="button"
        className={cn(
          landingCta("secondary", "md"),
          "h-12! min-h-12 w-full"
        )}
        disabled={confirming}
        onClick={onCancel}
      >
        Cancel
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
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <ConsentCheck
          id="accept-terms"
          checked={termsAccepted}
          onCheckedChange={onTermsChange}
        >
          I agree to the{" "}
          <LegalLink href={TERMS_OF_SERVICE_URL}>Terms of Service</LegalLink>
        </ConsentCheck>
        <ConsentCheck
          id="accept-privacy"
          checked={privacyAccepted}
          onCheckedChange={onPrivacyChange}
        >
          I agree to the{" "}
          <LegalLink href={PRIVACY_NOTICE_URL}>Privacy Policy</LegalLink>
        </ConsentCheck>
      </div>

      <p className="text-pretty px-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
        {DISCLAIMER}
      </p>
    </div>
  )
}

function LoginConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  confirming = false,
}: LoginConsentDialogProps) {
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
            <LoginConsentBrand />
            <DialogHeader className="gap-1.5 space-y-0 text-left">
              <DialogTitle className="text-[1.25rem] font-semibold tracking-[-0.02em]">
                {TITLE}
              </DialogTitle>
              <DialogDescription className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {DESCRIPTION}
              </DialogDescription>
            </DialogHeader>
            <LoginConsentBody
              termsAccepted={termsAccepted}
              privacyAccepted={privacyAccepted}
              onTermsChange={setTermsAccepted}
              onPrivacyChange={setPrivacyAccepted}
            />
          </div>
          <DialogFooter className="mx-0 mb-0 flex-col gap-2 rounded-none border-0 bg-transparent p-4 pt-2 sm:flex-col sm:justify-stretch">
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
        <div className={cn(chatMobileSheetBodyClass, "gap-4 pb-2")}>
          <LoginConsentBrand />
          <SheetHeader className={chatMobileSheetHeaderClass}>
            <SheetTitle className={cn(chatMobileSheetTitleClass, "text-lg")}>
              {TITLE}
            </SheetTitle>
            <SheetDescription
              className={cn(chatMobileSheetDescriptionClass, "text-[13px]")}
            >
              {DESCRIPTION}
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
          <div className={chatMobileSheetFooterBarClass}>{actions}</div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { LoginConsentDialog }
