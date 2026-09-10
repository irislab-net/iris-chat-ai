"use client"

import * as React from "react"
import Image from "next/image"
import { ExternalLinkIcon } from "lucide-react"

import { GoogleGlyph } from "@/components/auth/google-glyph"
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
import { cn } from "@/lib/utils"

type LoginConsentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  confirming?: boolean
}

const TITLE = "Before you connect"
const DESCRIPTION =
  "Review and accept IRIS Lab's legal terms to continue with Google."
const DISCLAIMER =
  "By continuing, you confirm that you are at least 18 years old, are not a U.S. Person or resident of a sanctioned jurisdiction, and acknowledge that IRIS Intel provides analytics for informational purposes only, not financial advice."

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
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow]",
        checked
          ? "border-sky-200/70 bg-sky-50/60 shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] dark:border-border/60 dark:bg-muted/50 dark:shadow-none"
          : "border-border/45 bg-background/90 hover:border-border/70 hover:bg-muted/35 dark:bg-muted/20"
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
      <Image
        src="/Logo.png"
        alt=""
        width={40}
        height={40}
        className="block size-10 shrink-0 rounded-xl"
        priority
      />
      <div className="min-w-0">
        <p className="text-[15px] font-medium leading-none tracking-tight text-foreground">
          IRIS Lab
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
}: {
  canContinue: boolean
  confirming: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        size="lg"
        className="h-12 w-full gap-2.5 rounded-full px-5 text-[15px] font-medium shadow-sm disabled:opacity-45"
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
        className="h-10 w-full rounded-full text-[15px] font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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

      <div className="rounded-xl border border-border/40 bg-muted/25 px-3.5 py-3 dark:bg-muted/15">
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
    />
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-[1.35rem] border border-border/40 bg-background p-0 shadow-xl ring-0 sm:max-w-[26rem]"
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
        className={cn(
          "max-h-[min(92dvh,720px)] gap-0 overflow-y-auto rounded-t-[1.75rem] border-0",
          "bg-linear-to-b from-background via-background to-sky-100/45 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2",
          "dark:to-muted/10"
        )}
      >
        <div
          aria-hidden
          className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20"
        />
        <div className="flex flex-col gap-5 px-5 pb-2">
          <LoginConsentBrand compact />
          <SheetHeader className="gap-1.5 space-y-0 p-0 text-left">
            <SheetTitle className="text-[22px] font-normal tracking-tight">
              {TITLE}
            </SheetTitle>
            <SheetDescription className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
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
        <SheetFooter className="sticky bottom-0 border-t border-border/40 bg-background/90 px-5 pt-4 pb-0 backdrop-blur-md">
          {actions}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { LoginConsentDialog }
