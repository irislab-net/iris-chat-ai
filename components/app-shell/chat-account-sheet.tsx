"use client"

import * as React from "react"
import {
  ArrowLeftRightIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  CookieIcon,
  FileTextIcon,
  LanguagesIcon,
  LogOutIcon,
  MailIcon,
  MonitorIcon,
  MoonIcon,
  NewspaperIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldIcon,
  SmartphoneIcon,
  SparklesIcon,
  SunIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import { ChatGsapViewStack } from "@/components/app-shell/chat-gsap-view-stack"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { LocaleFlag } from "@/components/i18n/locale-flag"
import { openCookieSettings } from "@/components/privacy/cookie-consent-banner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { Link, getPathname, usePathname } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"
import type { User } from "@/lib/api/types"
import {
  localeDirection,
  localeLabelKey,
  persistLocaleChoice,
} from "@/lib/i18n/locale"
import { getPrivacyNoticeHref, getTermsOfServiceHref } from "@/lib/legal"
import {
  BILLING_PATH,
  getMarketingHomePath,
  getMarketingPageHref,
  UPGRADE_PATH,
} from "@/lib/site"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

const CONTACT_EMAIL = "hello@exur.ai"

/** Soft gray sheet canvas — Gemini account / settings reference. */
const sheetCanvasClass =
  "gap-0 border-0 bg-[#F1F3F9] text-foreground shadow-[0_-16px_48px_-18px_color-mix(in_oklch,var(--foreground)_14%,transparent)] dark:bg-[oklch(0.22_0.01_260)] dark:shadow-[0_-16px_48px_-18px_color-mix(in_oklch,black_50%,transparent)]"

const sheetHandleClass =
  "mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-foreground/15 dark:bg-white/20"

const sheetCardClass =
  "rounded-[22px] bg-white shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent)] dark:bg-white/[0.08] dark:shadow-none"

const sheetPillClass = cn(
  sheetCardClass,
  "flex min-h-14 w-full items-center gap-3.5 rounded-full px-5 text-start text-[16px] font-medium tracking-[-0.01em] transition-colors active:bg-black/[0.03] dark:active:bg-white/[0.06]"
)

const sheetRowClass =
  "flex min-h-[3.25rem] w-full items-center gap-3.5 px-4 text-start text-[16px] font-normal tracking-[-0.01em] transition-colors active:bg-black/[0.03] dark:active:bg-white/[0.06]"

const sheetSectionLabelClass =
  "px-1 pb-2 pt-4 text-[13px] font-normal tracking-[0.01em] text-muted-foreground"

const sheetIconClass = "size-[22px] shrink-0 text-foreground/85"

type AccountSheetView =
  | "root"
  | "settings"
  | "theme"
  | "language"
  | "help"
  | "account"

type ChatAccountSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialView?: AccountSheetView
  user: User | null
  isProUser: boolean
  planName: string
  avatarUrl: string | null
  loginPending?: boolean
  onLogin?: () => void
  onLogout?: () => void | Promise<void>
  /** Log out then start a new sign-in (account picker). */
  onSwitchAccount?: () => void | Promise<void>
  onOpenNews?: () => void
}

function SheetDoneText({ onClick }: { onClick: () => void }) {
  const common = useTranslations("common")
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-1 text-[17px] font-medium text-[#1A73E8] dark:text-[#8AB4F8]"
    >
      {common("done")}
    </button>
  )
}

function SheetDoneCheck({ onClick }: { onClick: () => void }) {
  const common = useTranslations("common")
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={common("done")}
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-sm transition-transform active:scale-95 dark:bg-[#8AB4F8] dark:text-[#0F172A]"
    >
      <CheckIcon className="size-5" strokeWidth={2.5} />
    </button>
  )
}

function SheetRow({
  icon,
  label,
  value,
  onClick,
  href,
  external,
  chevron = true,
  destructive,
  divider,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  value?: React.ReactNode
  onClick?: () => void
  href?: string
  external?: boolean
  chevron?: boolean
  destructive?: boolean
  divider?: boolean
}) {
  const className = cn(
    sheetRowClass,
    destructive && "text-destructive",
    divider &&
      "border-t border-foreground/8 dark:border-white/10 [border-image:none]"
  )

  const body = (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1",
          destructive ? "text-destructive" : "text-foreground"
        )}
      >
        {label}
      </span>
      {value ? (
        <span className="flex max-w-32 shrink-0 items-center justify-end gap-1.5 truncate text-[14px] text-muted-foreground">
          {value}
        </span>
      ) : null}
      {chevron ? (
        <ChevronRightIcon
          className="size-4.5 shrink-0 text-foreground/25 rtl:rotate-180"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={onClick}
        >
          {body}
        </a>
      )
    }
    return (
      <Link href={href} className={className} onClick={onClick}>
        {body}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  )
}

function SheetCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(sheetCardClass, "overflow-hidden", className)}>
      {children}
    </div>
  )
}

function SheetPill({
  icon,
  label,
  onClick,
  href,
  external,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  onClick?: () => void
  href?: string
  external?: boolean
}) {
  const body = (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </>
  )

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={sheetPillClass}
          onClick={onClick}
        >
          {body}
        </a>
      )
    }
    return (
      <Link href={href} className={sheetPillClass} onClick={onClick}>
        {body}
      </Link>
    )
  }

  return (
    <button type="button" className={sheetPillClass} onClick={onClick}>
      {body}
    </button>
  )
}

function NestedViewChrome({
  title,
  onDone,
  onBack,
  children,
}: {
  title: string
  onDone: () => void
  onBack?: () => void
  children: React.ReactNode
}) {
  const common = useTranslations("common")
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6">
      <div className="flex shrink-0 items-center gap-2 pb-3 pt-1">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            aria-label={common("back")}
            onClick={onBack}
          >
            <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          </Button>
        ) : (
          <span className="size-10 shrink-0" aria-hidden />
        )}
        <h2 className="min-w-0 flex-1 truncate text-[22px] font-normal tracking-tight text-foreground">
          {title}
        </h2>
        <SheetDoneCheck onClick={onDone} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
}

/**
 * Mobile profile / settings bottom sheet — Gemini-style cards, pills, and
 * grouped settings with GSAP push navigation.
 */
function ChatAccountSheet({
  open,
  onOpenChange,
  initialView = "root",
  user,
  isProUser,
  planName,
  avatarUrl,
  loginPending = false,
  onLogin,
  onLogout,
  onSwitchAccount,
  onOpenNews,
}: ChatAccountSheetProps) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const consent = useTranslations("consent")
  const dir = localeDirection(useLocale())
  const pushSign: 1 | -1 = dir === "rtl" ? -1 : 1
  const popSign: 1 | -1 = dir === "rtl" ? 1 : -1

  const [view, setView] = React.useState<AccountSheetView>(initialView)
  const [enterFromSign, setEnterFromSign] = React.useState<1 | -1>(pushSign)
  const [openSnapshot, setOpenSnapshot] = React.useState(open)

  if (open !== openSnapshot) {
    setOpenSnapshot(open)
    if (open) {
      setView(initialView)
      setEnterFromSign(pushSign)
    }
  }

  const go = React.useCallback(
    (next: AccountSheetView, direction: "push" | "pop" = "push") => {
      setEnterFromSign(direction === "push" ? pushSign : popSign)
      setView(next)
    },
    [popSign, pushSign]
  )

  const closeSheet = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const { theme, setTheme } = useTheme()
  const activeTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system"
  const themeOptions = [
    { id: "system" as const, label: common("themeSystem"), Icon: MonitorIcon },
    { id: "light" as const, label: common("themeLight"), Icon: SunIcon },
    { id: "dark" as const, label: common("themeDark"), Icon: MoonIcon },
  ] as const
  const currentTheme =
    themeOptions.find((option) => option.id === activeTheme) ?? themeOptions[0]
  const ThemeIcon = currentTheme.Icon

  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const currentLocaleLabel = common(localeLabelKey(locale))

  function switchLocale(next: AppLocale) {
    if (next === locale) return
    persistLocaleChoice(next)
    const nextPath = getPathname({ locale: next, href: pathname })
    const { search, hash } = window.location
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full navigation
    window.location.assign(`${nextPath}${search}${hash}`)
  }

  const { isEligible, needsManualInstall, promptInstall } = usePwaInstall()

  const faqHref = `${getMarketingPageHref(getMarketingHomePath())}#faq`
  const whatIsHref = getMarketingPageHref("/what-is-exur")
  const termsHref = getTermsOfServiceHref()
  const privacyHref = getPrivacyNoticeHref()

  const email = user?.email?.trim() || (user ? userAccountSubline(user) : "")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          sheetCanvasClass,
          "flex h-[min(90dvh,720px)] flex-col overflow-hidden rounded-t-[28px] pt-2 pb-0 data-[side=bottom]:h-[min(90dvh,720px)]"
        )}
      >
        <div aria-hidden className={sheetHandleClass} />
        <SheetHeader className="sr-only">
          <SheetTitle>
            {view === "root"
              ? t("accountMenuFor", {
                  name: user ? userAccountLabel(user) : t("signIn"),
                })
              : t("exurSettings")}
          </SheetTitle>
        </SheetHeader>

        <ChatGsapViewStack
          active={view}
          enterFromSign={enterFromSign}
          className="min-h-0 w-full flex-1"
        >
          {/* —— Root profile (Gemini account sheet) —— */}
          <div
            data-view="root"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex shrink-0 items-center justify-end px-5 pb-2 pt-0.5">
              <SheetDoneText onClick={closeSheet} />
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4">
              {/* Profile card */}
              {user ? (
                <button
                  type="button"
                  onClick={() => go("account")}
                  className={cn(
                    sheetCardClass,
                    "flex w-full items-center gap-3.5 rounded-[22px] p-3.5 text-start transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.04]"
                  )}
                >
                  <ChatAccountAvatar
                    user={user}
                    avatarUrl={avatarUrl}
                    isProUser={isProUser}
                    planName={planName}
                    showPlanBadge={false}
                    avatarClassName="size-14 ring-2 ring-[#1A73E8]/70 ring-offset-2 ring-offset-[#F1F3F9] dark:ring-[#8AB4F8]/80 dark:ring-offset-[oklch(0.22_0.01_260)]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[17px] font-semibold tracking-tight text-foreground">
                      {userAccountLabel(user)}
                    </span>
                    {email ? (
                      <span className="truncate text-[13px] text-muted-foreground">
                        {email}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "mt-1 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                        isProUser
                          ? "border-[#1A73E8] text-[#1A73E8] dark:border-[#8AB4F8] dark:text-[#8AB4F8]"
                          : "border-foreground/20 text-muted-foreground"
                      )}
                    >
                      {planName}
                    </span>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/6 dark:bg-white/10">
                    <ChevronDownIcon
                      className="size-4 text-foreground/55"
                      aria-hidden
                    />
                  </span>
                </button>
              ) : (
                <div
                  className={cn(
                    sheetCardClass,
                    "flex items-center gap-3.5 rounded-[22px] p-3.5"
                  )}
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <GoogleGlyph className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold tracking-tight">
                      {common("brand")}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {t("signIn")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                {user ? (
                  <>
                    <SheetPill
                      icon={<ArrowLeftRightIcon className={sheetIconClass} />}
                      label={t("switchAccount")}
                      onClick={() => {
                        closeSheet()
                        void onSwitchAccount?.()
                      }}
                    />
                    <SheetPill
                      icon={<ReceiptIcon className={sheetIconClass} />}
                      label={t("billing")}
                      href={BILLING_PATH}
                      onClick={closeSheet}
                    />
                  </>
                ) : (
                  <SheetPill
                    icon={<GoogleGlyph className="size-5" />}
                    label={loginPending ? t("connecting") : t("signIn")}
                    onClick={() => {
                      if (loginPending) return
                      closeSheet()
                      onLogin?.()
                    }}
                  />
                )}

                <SheetPill
                  icon={<SettingsIcon className={sheetIconClass} />}
                  label={common("settings")}
                  onClick={() => go("settings")}
                />

                {onOpenNews ? (
                  <SheetPill
                    icon={<NewspaperIcon className={sheetIconClass} />}
                    label={t("news")}
                    onClick={() => {
                      closeSheet()
                      onOpenNews()
                    }}
                  />
                ) : null}
              </div>
            </div>

            <footer className="flex shrink-0 items-center justify-center gap-2 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-[12px] text-foreground/55">
              <a
                href={privacyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                {t("helpPrivacy")}
              </a>
              <span aria-hidden>·</span>
              <a
                href={termsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                {t("helpTerms")}
              </a>
            </footer>
          </div>

          {/* —— Account details (from profile chevron) —— */}
          <div data-view="account" className="flex min-h-0 flex-1 flex-col">
            <NestedViewChrome
              title={t("accountSection")}
              onDone={closeSheet}
              onBack={() => go("root", "pop")}
            >
              <SheetCard>
                {user && !isProUser ? (
                  <SheetRow
                    icon={<SparklesIcon className={sheetIconClass} />}
                    label={t("upgradeToPlus")}
                    href={UPGRADE_PATH}
                    onClick={closeSheet}
                    divider={false}
                  />
                ) : null}
                {user ? (
                  <SheetRow
                    icon={<ReceiptIcon className={sheetIconClass} />}
                    label={t("billing")}
                    href={BILLING_PATH}
                    onClick={closeSheet}
                    divider={Boolean(user && !isProUser)}
                  />
                ) : null}
                {isEligible ? (
                  <SheetRow
                    icon={<SmartphoneIcon className={sheetIconClass} />}
                    label={
                      needsManualInstall
                        ? t("addToHomeScreen")
                        : t("installApp")
                    }
                    onClick={() => {
                      void promptInstall()
                    }}
                    chevron={false}
                    divider={Boolean(user)}
                  />
                ) : null}
                {user ? (
                  <SheetRow
                    icon={<LogOutIcon className="size-[22px] shrink-0" />}
                    label={t("logOut")}
                    destructive
                    chevron={false}
                    divider
                    onClick={() => {
                      closeSheet()
                      void onLogout?.()
                    }}
                  />
                ) : null}
              </SheetCard>
            </NestedViewChrome>
          </div>

          {/* —— Settings (Gemini Settings pattern) —— */}
          <div data-view="settings" className="flex min-h-0 flex-1 flex-col">
            <NestedViewChrome
              title={t("exurSettings")}
              onDone={closeSheet}
              onBack={() => go("root", "pop")}
            >
              {user && !isProUser ? (
                <SheetCard className="mb-1">
                  <SheetRow
                    icon={<SparklesIcon className={sheetIconClass} />}
                    label={t("upgradeToPlus")}
                    href={UPGRADE_PATH}
                    onClick={closeSheet}
                  />
                </SheetCard>
              ) : null}

              <p className={sheetSectionLabelClass}>
                {t("preferencesSection")}
              </p>
              <SheetCard>
                <SheetRow
                  icon={<ThemeIcon className={sheetIconClass} />}
                  label={common("theme")}
                  value={currentTheme.label}
                  onClick={() => go("theme")}
                />
                <SheetRow
                  icon={<LanguagesIcon className={sheetIconClass} />}
                  label={common("language")}
                  value={currentLocaleLabel}
                  onClick={() => go("language")}
                  divider
                />
              </SheetCard>

              <p className={sheetSectionLabelClass}>
                {t("dataPrivacySection")}
              </p>
              <SheetCard>
                <SheetRow
                  icon={<CookieIcon className={sheetIconClass} />}
                  label={consent("manageTitle")}
                  chevron={false}
                  onClick={() => {
                    closeSheet()
                    openCookieSettings()
                  }}
                />
                <SheetRow
                  icon={<ShieldIcon className={sheetIconClass} />}
                  label={t("helpPrivacy")}
                  href={privacyHref}
                  external
                  onClick={closeSheet}
                  divider
                />
              </SheetCard>

              <p className={sheetSectionLabelClass}>
                {t("getSupportSection")}
              </p>
              <SheetCard>
                <SheetRow
                  icon={<CircleHelpIcon className={sheetIconClass} />}
                  label={t("help")}
                  onClick={() => go("help")}
                />
              </SheetCard>
            </NestedViewChrome>
          </div>

          {/* —— Theme —— */}
          <div data-view="theme" className="flex min-h-0 flex-1 flex-col">
            <NestedViewChrome
              title={common("theme")}
              onDone={closeSheet}
              onBack={() => go("settings", "pop")}
            >
              <SheetCard>
                {themeOptions.map(({ id, label, Icon }, index) => (
                  <SheetRow
                    key={id}
                    icon={<Icon className={sheetIconClass} />}
                    label={label}
                    chevron={false}
                    divider={index > 0}
                    value={
                      activeTheme === id ? (
                        <CheckIcon
                          className="size-5 text-[#1A73E8] dark:text-[#8AB4F8]"
                          aria-hidden
                        />
                      ) : null
                    }
                    onClick={() => setTheme(id)}
                  />
                ))}
              </SheetCard>
            </NestedViewChrome>
          </div>

          {/* —— Language —— */}
          <div data-view="language" className="flex min-h-0 flex-1 flex-col">
            <NestedViewChrome
              title={common("language")}
              onDone={closeSheet}
              onBack={() => go("settings", "pop")}
            >
              <SheetCard>
                {routing.locales.map((code, index) => {
                  const active = locale === code
                  const label = common(localeLabelKey(code))
                  return (
                    <SheetRow
                      key={code}
                      icon={
                        <LocaleFlag
                          locale={code}
                          title={label}
                          tone={active ? "color" : "mono"}
                          className="size-5"
                        />
                      }
                      label={label}
                      chevron={false}
                      divider={index > 0}
                      value={
                        active ? (
                          <CheckIcon
                            className="size-5 text-[#1A73E8] dark:text-[#8AB4F8]"
                            aria-hidden
                          />
                        ) : null
                      }
                      onClick={() => switchLocale(code)}
                    />
                  )
                })}
              </SheetCard>
            </NestedViewChrome>
          </div>

          {/* —— Help —— */}
          <div data-view="help" className="flex min-h-0 flex-1 flex-col">
            <NestedViewChrome
              title={t("help")}
              onDone={closeSheet}
              onBack={() => go("settings", "pop")}
            >
              <SheetCard>
                <SheetRow
                  icon={<CircleHelpIcon className={sheetIconClass} />}
                  label={t("helpFaq")}
                  href={faqHref}
                  external
                  onClick={closeSheet}
                />
                <SheetRow
                  icon={<BookOpenIcon className={sheetIconClass} />}
                  label={t("helpWhatIsExur")}
                  href={whatIsHref}
                  external
                  onClick={closeSheet}
                  divider
                />
                <SheetRow
                  icon={<FileTextIcon className={sheetIconClass} />}
                  label={t("helpTerms")}
                  href={termsHref}
                  external
                  onClick={closeSheet}
                  divider
                />
                <SheetRow
                  icon={<MailIcon className={sheetIconClass} />}
                  label={t("helpContact")}
                  href={`mailto:${CONTACT_EMAIL}`}
                  external
                  onClick={closeSheet}
                  divider
                />
              </SheetCard>
            </NestedViewChrome>
          </div>
        </ChatGsapViewStack>
      </SheetContent>
    </Sheet>
  )
}

export { ChatAccountSheet }
export type { AccountSheetView, ChatAccountSheetProps }
