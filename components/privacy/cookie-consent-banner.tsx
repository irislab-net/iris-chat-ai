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

function CookieBannerActions({
  onAccept,
  onReject,
  onManage,
  stacked,
}: {
  onAccept: () => void
  onReject: () => void
  onManage: () => void
  stacked?: boolean
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
      {stacked ? (
        <>
          <Button
            type="button"
            className={cn(
              landingCta("secondary", "md"),
              "h-12! min-h-12 w-full"
            )}
            onClick={onReject}
          >
            {t("reject")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full rounded-full text-[15px] font-medium text-foreground hover:bg-foreground/5"
            onClick={onManage}
          >
            {t("manage")}
          </Button>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            className={cn(
              landingCta("secondary", "sm"),
              "h-11! min-h-11 w-full"
            )}
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
      )}
    </div>
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
  const [manageOpen, setManageOpen] = React.useState(false)
  const [analyticsDraft, setAnalyticsDraft] = React.useState(false)

  // Banner only while no choice yet — and never while manage is open.
  const showBanner = isClient && prefs === null && !manageOpen
  const showManage = manageOpen

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
    // If prefs is still null, showBanner becomes true again automatically.
  }, [])

  if (!isClient || isDesktop === null) return null

  const bannerActions = (
    <CookieBannerActions
      stacked={!isDesktop}
      onAccept={() => commit(true)}
      onReject={() => commit(false)}
      onManage={openManage}
    />
  )

  const manageBody = (
    <CookiePreferencesBody
      analyticsDraft={analyticsDraft}
      onAnalyticsChange={setAnalyticsDraft}
    />
  )

  const manageActions = (
    <CookiePreferencesActions
      onReject={() => commit(false)}
      onSave={() => commit(analyticsDraft)}
    />
  )

  return (
    <>
      {/* Desktop banner — unmounted while manage is open */}
      {isDesktop && showBanner ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className="fixed inset-e-4 bottom-4 z-60 w-full max-w-md text-foreground"
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
            <div className="mt-4">{bannerActions}</div>
          </div>
        </div>
      ) : null}

      {isDesktop ? (
        <Dialog
          open={showManage}
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
              {manageBody}
            </div>
            <div className="flex w-full flex-col gap-2.5 p-4 pt-3">
              {manageActions}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Mobile banner sheet */}
      {!isDesktop ? (
        <Sheet
          open={showBanner}
          onOpenChange={(open) => {
            if (!open) return
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className={cn(chatMobileSheetContentClass, "z-60 gap-0 border-0")}
          >
            <div aria-hidden className={chatMobileSheetHandleClass} />
            <div className={cn(chatMobileSheetBodyClass, "gap-5 pb-1")}>
              <SheetHeader className={cn(chatMobileSheetHeaderClass, "px-0")}>
                <SheetTitle
                  className={cn(chatMobileSheetTitleClass, "text-[1.35rem]")}
                >
                  {t("title")}
                </SheetTitle>
                <SheetDescription
                  className={cn(chatMobileSheetDescriptionClass, "text-[14px]")}
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
                </SheetDescription>
              </SheetHeader>
            </div>
            <SheetFooter className={chatMobileSheetFooterClass}>
              <div className={chatMobileSheetFooterBarClass}>
                {bannerActions}
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : null}

      {/* Mobile manage sheet — replaces banner */}
      {!isDesktop ? (
        <Sheet
          open={showManage}
          onOpenChange={(open) => {
            if (!open) closeManage()
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton
            className={cn(chatMobileSheetContentClass, "z-70 gap-0 border-0")}
          >
            <div aria-hidden className={chatMobileSheetHandleClass} />
            <div className={cn(chatMobileSheetBodyClass, "gap-4 pb-2")}>
              <SheetHeader className={cn(chatMobileSheetHeaderClass, "pe-8")}>
                <SheetTitle
                  className={cn(chatMobileSheetTitleClass, "text-lg")}
                >
                  {t("manageTitle")}
                </SheetTitle>
                <SheetDescription
                  className={cn(chatMobileSheetDescriptionClass, "text-[13px]")}
                >
                  {t("manageDescription")}
                </SheetDescription>
              </SheetHeader>
              {manageBody}
            </div>
            <SheetFooter className={chatMobileSheetFooterClass}>
              <div className={chatMobileSheetFooterBarClass}>
                {manageActions}
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
