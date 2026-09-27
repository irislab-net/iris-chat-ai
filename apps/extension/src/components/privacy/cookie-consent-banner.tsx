"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  chatLoginConsentDialogClass,
  chatMobileSheetConsentCheckedClass,
  chatMobileSheetConsentUncheckedClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { landingCta } from "@/lib/landing-modern-styles"
import { getPrivacyNoticeHref } from "@/lib/legal"
import {
  CONSENT_OPEN_EVENT,
  getConsentSnapshot,
  getServerConsentSnapshot,
  getStoredConsent,
  setStoredConsent,
  subscribeConsent,
} from "@/lib/consent"
import { cn } from "@/lib/utils"

const cookieBannerSurfaceClass =
  "border-0 bg-white/82 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_16px_48px_-18px_color-mix(in_oklch,var(--foreground)_16%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68 dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_16px_48px_-18px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07]"

function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function PreferenceRow({
  id,
  title,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  title: string
  hint: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const labelId = `${id}-label`

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-[background-color,box-shadow]",
        checked
          ? chatMobileSheetConsentCheckedClass
          : chatMobileSheetConsentUncheckedClass
      )}
    >
      <div className="min-w-0 flex-1 text-start">
        <p
          id={labelId}
          className="text-[13px] leading-snug font-medium tracking-[-0.01em] text-foreground"
        >
          {title}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
        className={cn(
          "mt-0.5 shrink-0",
          checked &&
            "bg-[#2563EB] hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB]/40",
          disabled && "opacity-60 hover:bg-[#2563EB]"
        )}
      />
    </div>
  )
}

function CookiePreferencesBody({
  analyticsDraft,
  onAnalyticsChange,
}: {
  analyticsDraft: boolean
  onAnalyticsChange: (checked: boolean) => void
}) {
  const t = useTranslations("consent")

  return (
    <div className="flex flex-col gap-2.5">
      <PreferenceRow
        id="consent-necessary"
        title={t("necessary")}
        hint={t("necessaryHint")}
        checked
        disabled
        onCheckedChange={() => {}}
      />
      <PreferenceRow
        id="consent-analytics"
        title={t("analytics")}
        hint={t("analyticsHint")}
        checked={analyticsDraft}
        onCheckedChange={onAnalyticsChange}
      />
    </div>
  )
}

function CookieBannerActions({
  onAccept,
  onReject,
  onManage,
}: {
  onAccept: () => void
  onReject: () => void
  onManage: () => void
}) {
  const t = useTranslations("consent")

  return (
    <div className="flex w-full flex-col gap-2.5">
      <Button
        type="button"
        className={cn(landingCta("primary", "md"), "h-12! min-h-12 w-full")}
        onClick={onAccept}
      >
        {t("accept")}
      </Button>
      <Button
        type="button"
        className={cn(landingCta("secondary", "md"), "h-12! min-h-12 w-full")}
        onClick={onReject}
      >
        {t("reject")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full rounded-full text-sm font-medium text-foreground hover:bg-foreground/5"
        onClick={onManage}
      >
        {t("manage")}
      </Button>
    </div>
  )
}

function CookieConsentBanner() {
  const t = useTranslations("consent")
  const isClient = useIsClient()
  const prefs = React.useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  )
  const [manageOpen, setManageOpen] = React.useState(false)
  const [analyticsDraft, setAnalyticsDraft] = React.useState(false)

  const showBanner = isClient && prefs === null && !manageOpen

  React.useEffect(() => {
    const openManage = () => {
      setAnalyticsDraft(Boolean(getStoredConsent()?.analytics))
      setManageOpen(true)
    }
    window.addEventListener(CONSENT_OPEN_EVENT, openManage)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openManage)
  }, [])

  const commit = React.useCallback((analytics: boolean) => {
    setStoredConsent({ analytics, advertising: false })
    setManageOpen(false)
  }, [])

  const openManage = React.useCallback(() => {
    setAnalyticsDraft(false)
    setManageOpen(true)
  }, [])

  const closeManage = React.useCallback(() => {
    setManageOpen(false)
  }, [])

  if (!isClient) return null

  return (
    <>
      {showBanner ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className="fixed inset-x-3 bottom-3 z-60 w-auto max-w-md text-foreground sm:inset-e-4 sm:bottom-4 sm:start-auto sm:w-full"
        >
          <div className={cn("rounded-[1.5rem] p-5", cookieBannerSurfaceClass)}>
            <h2
              id="cookie-consent-title"
              className="text-[1.05rem] font-semibold tracking-[-0.02em] text-foreground"
            >
              {t("title")}
            </h2>
            <p
              id="cookie-consent-desc"
              className="mt-2 text-[13px] leading-relaxed text-pretty text-muted-foreground"
            >
              {t("description")}{" "}
              <a
                href={getPrivacyNoticeHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-colors hover:decoration-foreground/55"
              >
                {t("privacyLink")}
              </a>
            </p>
            <div className="mt-4">
              <CookieBannerActions
                onAccept={() => commit(true)}
                onReject={() => commit(false)}
                onManage={openManage}
              />
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={manageOpen}
        onOpenChange={(open) => {
          if (!open) closeManage()
        }}
      >
        <DialogContent
          className={cn(chatLoginConsentDialogClass, "z-70 flex flex-col")}
          showCloseButton
        >
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
            <DialogHeader className="gap-1.5 space-y-0 pe-8 text-start">
              <DialogTitle className="text-[1.25rem] font-semibold tracking-[-0.02em]">
                {t("manageTitle")}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
                {t("manageDescription")}
              </DialogDescription>
            </DialogHeader>
            <CookiePreferencesBody
              analyticsDraft={analyticsDraft}
              onAnalyticsChange={setAnalyticsDraft}
            />
          </div>
          <div className="flex w-full flex-col gap-2.5 p-4 pt-3">
            <Button
              type="button"
              className={cn(
                landingCta("primary", "md"),
                "h-12! min-h-12 w-full"
              )}
              onClick={() => commit(analyticsDraft)}
            >
              {t("save")}
            </Button>
            <Button
              type="button"
              className={cn(
                landingCta("secondary", "md"),
                "h-12! min-h-12 w-full"
              )}
              onClick={() => commit(false)}
            >
              {t("reject")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function openCookieSettings() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}

export { CookieConsentBanner, openCookieSettings }
