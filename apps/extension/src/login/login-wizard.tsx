"use client"

import * as React from "react"
import { ExternalLinkIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { loginWithGoogle } from "@/adapters/auth"
import {
  EXUR_AUTH_CANCELLED,
  EXUR_AUTH_SUCCESS,
  EXUR_LOGIN_ERROR,
} from "@/adapters/login-messages"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { ExurLogo } from "@/components/brand/exur-logo"
import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  chatLoginConsentBrandMarkClass,
  chatLoginConsentDialogClass,
  chatMobileSheetConsentCheckedClass,
  chatMobileSheetConsentUncheckedClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { getPrivacyNoticeHref, getTermsOfServiceHref } from "@/lib/legal"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

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
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-start transition-[background-color,box-shadow]",
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

function friendlyLoginError(raw: string): { title: string; detail?: string } {
  if (/cancel/i.test(raw)) {
    return { title: "Sign-in was cancelled. You can try again when ready." }
  }
  if (/redirect|chromiumapp|did not approve|id_token/i.test(raw)) {
    const uriMatch = raw.match(/https:\/\/[a-z0-9]+\.chromiumapp\.org\/?/)
    return {
      title: "Google sign-in isn’t set up for this extension yet.",
      detail: uriMatch
        ? `Add this redirect URI in Google Cloud Console → OAuth client:\n${uriMatch[0]}`
        : undefined,
    }
  }
  if (/Client ID|VITE_GOOGLE/i.test(raw)) {
    return {
      title: "Missing Google Client ID in the extension build.",
      detail: raw,
    }
  }
  return { title: "Couldn’t complete Google sign-in. Please try again." }
}

function LoginWizard() {
  const t = useTranslations("workspace")
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const canContinue = termsAccepted && privacyAccepted && !confirming
  const friendlyError = error ? friendlyLoginError(error) : null

  const finishTab = React.useCallback(() => {
    window.setTimeout(() => {
      try {
        window.close()
      } catch {
        /* tab may stay open if Chrome blocks close */
      }
    }, 160)
  }, [])

  const handleCancel = React.useCallback(() => {
    void chrome.runtime.sendMessage({ type: EXUR_AUTH_CANCELLED })
    finishTab()
  }, [finishTab])

  const handleConfirm = React.useCallback(() => {
    if (!canContinue) return
    setConfirming(true)
    setError(null)
    void loginWithGoogle()
      .then(() => {
        void chrome.runtime.sendMessage({ type: EXUR_AUTH_SUCCESS })
        finishTab()
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Google sign-in failed"
        if (!/cancel/i.test(message)) {
          setError(message)
          void chrome.runtime.sendMessage({
            type: EXUR_LOGIN_ERROR,
            error: message,
          })
        }
        setConfirming(false)
      })
  }, [canContinue, finishTab])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#FAFBFC] text-foreground">
      <ChatMobileGeminiBackground variant="hero" visible active />

      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 sm:px-8">
        <div className="flex items-center gap-2.5">
          <ExurLogo
            decorative
            size={36}
            className="size-9 rounded-full shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)]"
            priority
            variant="gradient"
          />
          <span className="text-[1.05rem] font-semibold tracking-[-0.03em] text-foreground">
            Exur
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-28 pt-4 sm:px-6 sm:pb-32">
        <div className="mb-8 max-w-md text-center sm:mb-10">
          <p className="text-[12px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t("secureSignInWithGoogle")}
          </p>
          <h1 className="mt-2 text-[1.85rem] leading-[1.1] font-semibold tracking-[-0.03em] text-foreground sm:text-[2.15rem]">
            {t("continueWithGoogle")}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-pretty text-muted-foreground">
            {t("loginConsentDescription")}
          </p>
        </div>

        <div
          className={cn(
            chatLoginConsentDialogClass,
            "w-full max-w-104 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_80%,transparent),0_28px_80px_-28px_color-mix(in_oklch,var(--foreground)_18%,transparent)]"
          )}
        >
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-3">
              <span className={chatLoginConsentBrandMarkClass}>
                <ExurLogo
                  decorative
                  size={28}
                  className="size-7 rounded-full"
                  priority
                  variant="gradient"
                />
              </span>
              <div className="min-w-0 text-start">
                <p className="text-[15px] leading-none font-semibold tracking-[-0.02em] text-foreground">
                  Exur
                </p>
                <p className="mt-1.5 text-[12px] leading-none text-muted-foreground">
                  {t("secureSignInWithGoogle")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <ConsentCheck
                id="accept-terms"
                checked={termsAccepted}
                onCheckedChange={setTermsAccepted}
              >
                {t.rich("agreeTerms", {
                  link: (chunks) => (
                    <LegalLink href={getTermsOfServiceHref()}>
                      {chunks}
                    </LegalLink>
                  ),
                })}
              </ConsentCheck>
              <ConsentCheck
                id="accept-privacy"
                checked={privacyAccepted}
                onCheckedChange={setPrivacyAccepted}
              >
                {t.rich("agreePrivacy", {
                  link: (chunks) => (
                    <LegalLink href={getPrivacyNoticeHref()}>
                      {chunks}
                    </LegalLink>
                  ),
                })}
              </ConsentCheck>
            </div>

            <p className="px-0.5 text-[11.5px] leading-relaxed text-pretty text-muted-foreground">
              {t("loginConsentDisclaimer")}
            </p>

            {friendlyError ? (
              <div
                role="alert"
                className="rounded-2xl bg-[#FEF2F2] px-3.5 py-3 text-start dark:bg-destructive/15"
              >
                <p className="text-[13px] leading-snug font-medium text-[#B91C1C] dark:text-destructive">
                  {friendlyError.title}
                </p>
                {friendlyError.detail ? (
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed break-all text-[#991B1B]/85 dark:text-destructive/80">
                    {friendlyError.detail}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2.5 p-4 pt-2 sm:p-5 sm:pt-3">
            <Button
              type="button"
              className={cn(
                landingCta("primary", "md"),
                "h-12! min-h-12 w-full disabled:opacity-45"
              )}
              disabled={!canContinue}
              onClick={handleConfirm}
            >
              <GoogleGlyph className="size-4 shrink-0 rtl:order-last" />
              {confirming ? t("connecting") : t("agreeContinueWithGoogle")}
            </Button>
            <Button
              type="button"
              className={cn(
                landingCta("secondary", "md"),
                "h-12! min-h-12 w-full"
              )}
              disabled={confirming}
              onClick={handleCancel}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </main>

      <CookieConsentBanner />
    </div>
  )
}

export { LoginWizard }
