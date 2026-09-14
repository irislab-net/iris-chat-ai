"use client"

import * as React from "react"
import { ExternalLinkIcon } from "lucide-react"

import { GoogleGlyph } from "@/components/auth/google-glyph"
import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
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
  chatMobileSheetBodyClass,
  chatMobileSheetConsentCheckedClass,
  chatMobileSheetConsentUncheckedClass,
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
import { cn } from "@/lib/utils"

type LoginConsentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  confirming?: boolean
}

const TITLE = "Before you connect"
const DESCRIPTION =
  "Review and accept Exur's legal terms to continue with Google."
const DISCLAIMER =
  "By continuing, you confirm that you are at least 18 years old, are not a U.S. Person or resident of a sanctioned jurisdiction, and acknowledge that Exur Intel provides analytics for informational purposes only, not financial advice."

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
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow]",
        checked
          ? chatMobileSheetConsentCheckedClass
          : chatMobileSheetConsentUncheckedClass
      )}
    >
      <span
        id={labelId}
        className="min-w-0 flex-1 text-[15px] leading-snug text-foreground"
      >
        {children}
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
        className="shrink-0"
      />
    </label>
  )
}

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-border underline-offset-[3px] transition-colors hover:decoration-foreground/40"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
      <ExternalLinkIcon className="size-3 opacity-50" aria-hidden />
    </a>
  )
}

function LoginConsentBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        compact ? "px-5 pb-1" : "pb-2"
      )}
    >
      <IrisLabLogo
        decorative
        size={40}
        className="size-10 shrink-0 rounded-full"
        priority
      />
      <div className="min-w-0">
        <p className="text-[15px] font-medium leading-none tracking-tight text-foreground">
          Exur
        </p>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
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
  mobile = false,
}: {
  canContinue: boolean
  confirming: boolean
  onConfirm: () => void
  onCancel: () => void
  mobile?: boolean
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        size="lg"
        className={cn(
          "h-12 w-full gap-2.5 rounded-full px-5 text-[15px] font-medium shadow-none disabled:opacity-45",
          mobile && chatMobileSheetPrimaryButtonClass
        )}
        disabled={!canContinue}
        onClick={onConfirm}
      >
        <GoogleGlyph className="size-4" />
        {confirming ? "Connecting…" : "Agree & continue with Google"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className={cn(
          mobile
            ? chatMobileSheetGhostButtonClass
            : "h-10 w-full rounded-full text-[15px] font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
    <div className="flex flex-col gap-4">
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

      <div className="rounded-2xl border border-black/6 bg-white/70 px-3.5 py-3 dark:border-border/40 dark:bg-muted/15">
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          {DISCLAIMER}
        </p>
      </div>
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
      mobile={!isDesktop}
    />
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-[1.35rem] border border-border/40 bg-background p-0 shadow-xl ring-0 sm:max-w-104"
          showCloseButton={!confirming}
        >
          <div className="flex flex-col gap-5 px-6 pt-6 pb-2">
            <LoginConsentBrand />
            <DialogHeader className="gap-1.5 space-y-0 text-left">
              <DialogTitle className="text-[22px] font-normal tracking-tight">
                {TITLE}
              </DialogTitle>
              <DialogDescription className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
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
          <DialogFooter className="mx-0 mb-0 flex-col gap-2 rounded-none border-t border-border/40 bg-muted/10 p-5 pt-4 sm:flex-col sm:justify-stretch">
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
        className={chatMobileSheetContentClass}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <div className={cn(chatMobileSheetBodyClass, "gap-5 pb-2")}>
          <LoginConsentBrand compact />
          <SheetHeader className={chatMobileSheetHeaderClass}>
            <SheetTitle className={chatMobileSheetTitleClass}>{TITLE}</SheetTitle>
            <SheetDescription className={chatMobileSheetDescriptionClass}>
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
          <div className={cn(chatMobileSheetFooterBarClass, "px-5")}>{actions}</div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { LoginConsentDialog }
