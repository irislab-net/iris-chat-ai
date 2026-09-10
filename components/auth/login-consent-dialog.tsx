"use client"

import * as React from "react"
import { ExternalLinkIcon } from "lucide-react"

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
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-muted/40 px-3.5 py-3 text-left transition-colors",
        "hover:bg-muted/70",
        checked && "border-foreground/20 bg-muted"
      )}
    >
      <span
        id={labelId}
        className="min-w-0 flex-1 text-sm leading-relaxed text-foreground sm:text-[15px]"
      >
        {children}
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
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
      className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
      <ExternalLinkIcon className="size-3 opacity-60" aria-hidden />
    </a>
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
    <>
      <Button
        type="button"
        size="lg"
        className="h-11 w-full rounded-2xl px-4 text-base font-semibold whitespace-normal"
        disabled={!canContinue}
        onClick={onConfirm}
      >
        {confirming ? "Connecting…" : "Agree & continue with Google"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="h-11 w-full rounded-2xl text-muted-foreground hover:text-foreground"
        disabled={confirming}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </>
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
    <>
      <div className="flex flex-col gap-2.5">
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

      <p className="text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">
        By continuing, you confirm that you are at least 18 years old, are not a
        U.S. Person or resident of a sanctioned jurisdiction, and acknowledge
        that IRIS Intel provides analytics for informational purposes only, not
        financial advice.
      </p>
    </>
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

  const title = "Before you connect"
  const description =
    "Review and accept IRIS Lab's legal terms to continue with Google."

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-3xl border-0 p-0 ring-0 sm:max-w-md"
          showCloseButton={!confirming}
        >
          <div className="flex flex-col gap-5 px-6 pt-7 pb-2">
            <DialogHeader className="gap-2 text-left">
              <DialogTitle className="text-xl tracking-tight">{title}</DialogTitle>
              <DialogDescription className="text-pretty text-base leading-relaxed">
                {description}
              </DialogDescription>
            </DialogHeader>
            <LoginConsentBody
              termsAccepted={termsAccepted}
              privacyAccepted={privacyAccepted}
              onTermsChange={setTermsAccepted}
              onPrivacyChange={setPrivacyAccepted}
            />
          </div>
          <DialogFooter className="mx-0 mb-0 flex-col gap-2 rounded-none border-t-0 bg-transparent p-5 pt-3 sm:flex-col sm:justify-stretch">
            <LoginConsentActions
              canContinue={canContinue}
              confirming={confirming}
              onConfirm={onConfirm}
              onCancel={resetAndClose}
            />
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
        className="gap-0 rounded-t-2xl border-0 bg-popover pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
      >
        <div
          aria-hidden
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/25"
        />
        <SheetHeader className="gap-2 px-4 pb-2 text-left">
          <SheetTitle className="text-xl tracking-tight">{title}</SheetTitle>
          <SheetDescription className="text-pretty text-base leading-relaxed">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4 pb-2">
          <LoginConsentBody
            termsAccepted={termsAccepted}
            privacyAccepted={privacyAccepted}
            onTermsChange={setTermsAccepted}
            onPrivacyChange={setPrivacyAccepted}
          />
        </div>
        <SheetFooter className="border-0 pt-2">
          <LoginConsentActions
            canContinue={canContinue}
            confirming={confirming}
            onConfirm={onConfirm}
            onCancel={resetAndClose}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { LoginConsentDialog }
