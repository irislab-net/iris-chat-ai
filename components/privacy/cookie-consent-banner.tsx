"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch"
import { useIsDesktop } from "@/hooks/use-media-query"
import { Link } from "@/i18n/navigation"
import { landingCta } from "@/lib/landing-modern-styles"
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
          className="text-[13px] font-medium leading-snug tracking-[-0.01em] text-foreground"
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

function CookiePreferencesActions({
  onReject,
  onSave,
}: {
  onReject: () => void
  onSave: () => void
}) {
  const t = useTranslations("consent")

  return (
    <div className="flex w-full flex-col gap-2.5">
      <Button
        type="button"
        className={cn(landingCta("primary", "md"), "h-12! min-h-12 w-full")}
        onClick={onSave}
      >
        {t("save")}
      </Button>
      <Button
        type="button"
        className={cn(landingCta("secondary", "md"), "h-12! min-h-12 w-full")}
        onClick={onReject}
      >
        {t("reject")}
      </Button>
    </div>
  )
}

function CookiePreferencesPanel({
  analyticsDraft,
  onAnalyticsChange,
  onReject,
  onSave,
}: {
  analyticsDraft: boolean
  onAnalyticsChange: (checked: boolean) => void
  onReject: () => void
  onSave: () => void
}) {
  const t = useTranslations("consent")

  return (
    <>
      <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
        <DialogHeader className="gap-1.5 space-y-0 pe-8 text-start">
          <DialogTitle className="text-[1.25rem] font-semibold tracking-[-0.02em]">
            {t("manageTitle")}
          </DialogTitle>
          <DialogDescription className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
            {t("manageDescription")}
          </DialogDescription>
        </DialogHeader>
        <CookiePreferencesBody
          analyticsDraft={analyticsDraft}
          onAnalyticsChange={onAnalyticsChange}
        />
      </div>
      <div className="flex w-full flex-col gap-2.5 p-4 pt-3">
        <CookiePreferencesActions onReject={onReject} onSave={onSave} />
      </div>
    </>
  )
}

function CookieConsentBanner() {
  const t = useTranslations("consent")
  const isClient = useIsClient()
  const isDesktop = useIsDesktop()
  const prefs = React.useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  )
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [analyticsDraft, setAnalyticsDraft] = React.useState(false)

  const bannerVisible = isClient && prefs === null

  React.useEffect(() => {
    const open = () => {
      setAnalyticsDraft(Boolean(getStoredConsent()?.analytics))
      setDialogOpen(true)
    }
    window.addEventListener(CONSENT_OPEN_EVENT, open)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open)
  }, [])

  const commit = React.useCallback((analytics: boolean) => {
    setStoredConsent({ analytics, advertising: false })
    setDialogOpen(false)
  }, [])

  if (!isClient) return null

  const onReject = () => commit(false)
  const onSave = () => commit(analyticsDraft)

  return (
    <>
      {bannerVisible ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className={cn(
            "fixed inset-x-0 bottom-0 z-60 p-4 text-foreground sm:inset-x-auto sm:end-4 sm:bottom-4 sm:max-w-md sm:p-0",
            "pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pb-0"
          )}
        >
          <div
            className={cn(
              "rounded-t-[1.75rem] p-5 sm:rounded-[1.5rem]",
              cookieBannerSurfaceClass
            )}
          >
            <h2
              id="cookie-consent-title"
              className="text-[1.05rem] font-semibold tracking-[-0.02em] text-foreground"
            >
              {t("title")}
            </h2>
            <p
              id="cookie-consent-desc"
              className="mt-2 text-pretty text-[13px] leading-relaxed text-muted-foreground"
            >
              {t("description")}{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-colors hover:decoration-foreground/55"
              >
                {t("privacyLink")}
              </Link>
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <Button
                type="button"
                className={cn(
                  landingCta("primary", "md"),
                  "h-11! min-h-11 w-full"
                )}
                onClick={() => commit(true)}
              >
                {t("accept")}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className={cn(
                    landingCta("secondary", "sm"),
                    "h-11! min-h-11 w-full"
                  )}
                  onClick={() => commit(false)}
                >
                  {t("reject")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-full rounded-full text-sm font-medium text-foreground hover:bg-foreground/[0.05]"
                  onClick={() => {
                    setAnalyticsDraft(false)
                    setDialogOpen(true)
                  }}
                >
                  {t("manage")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isDesktop === true ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            className={cn(chatLoginConsentDialogClass, "flex flex-col")}
            showCloseButton
          >
            <CookiePreferencesPanel
              analyticsDraft={analyticsDraft}
              onAnalyticsChange={setAnalyticsDraft}
              onReject={onReject}
              onSave={onSave}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {isDesktop === false ? (
        <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
          <SheetContent
            side="bottom"
            showCloseButton
            className={cn(chatMobileSheetContentClass, "gap-0 border-0")}
          >
            <div aria-hidden className={chatMobileSheetHandleClass} />
            <div className={cn(chatMobileSheetBodyClass, "gap-4 pb-2")}>
              <SheetHeader className={cn(chatMobileSheetHeaderClass, "pe-8")}>
                <SheetTitle className={cn(chatMobileSheetTitleClass, "text-lg")}>
                  {t("manageTitle")}
                </SheetTitle>
                <SheetDescription
                  className={cn(chatMobileSheetDescriptionClass, "text-[13px]")}
                >
                  {t("manageDescription")}
                </SheetDescription>
              </SheetHeader>
              <CookiePreferencesBody
                analyticsDraft={analyticsDraft}
                onAnalyticsChange={setAnalyticsDraft}
              />
            </div>
            <SheetFooter className={chatMobileSheetFooterClass}>
              <div className={chatMobileSheetFooterBarClass}>
                <CookiePreferencesActions
                  onReject={onReject}
                  onSave={onSave}
                />
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}

function openCookieSettings() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}

export { CookieConsentBanner, openCookieSettings }
