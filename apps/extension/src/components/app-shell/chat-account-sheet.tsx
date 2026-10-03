"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import {
  ChatAccountAvatar,
  ChatGuestAvatar,
} from "@/components/app-shell/chat-account-avatar"
import { ChatGsapViewStack } from "@/components/app-shell/chat-gsap-view-stack"
import {
  chatAccentSecondaryFillClass,
  chatUpgradePillClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { LocaleFlag } from "@/components/i18n/locale-flag"
import {
  SfBookIcon,
  SfCheckIcon,
  SfChevronDownIcon,
  SfChevronRightIcon,
  SfCreditCardIcon,
  SfDesktopIcon,
  SfDocTextIcon,
  SfGearIcon,
  SfGlobeIcon,
  SfLogoutIcon,
  SfMailIcon,
  SfMoonIcon,
  SfNewspaperIcon,
  SfQuestionCircleIcon,
  SfShieldIcon,
  SfSparklesIcon,
  SfSunIcon,
  SfSwitchAccountIcon,
} from "@/components/icons/sf-menu-icons"
import { Button } from "@/components/ui/button"
import { SelectionCheckBadge } from "@/components/ui/selection-check-badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  "rounded-2xl bg-white shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent)] dark:bg-white/[0.08] dark:shadow-none"

/** Menu rows — slightly less round than full capsules. */
const sheetPillClass = cn(
  sheetCardClass,
  "flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-5 text-start text-[16px] font-medium tracking-[-0.01em] transition-colors active:bg-black/[0.03] dark:active:bg-white/[0.06]"
)

const sheetPrimaryPillClass = cn(
  chatUpgradePillClass,
  "inline-flex h-8 w-fit items-center justify-center gap-1.5 px-3.5 text-[13px] font-semibold"
)

/** Secondary blue liquid-glass Done check circle. */
const sheetBlueGlassIconButtonClass = cn(
  chatAccentSecondaryFillClass,
  "chat-ios26-liquid-glass relative isolate flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full px-0"
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

function SheetDoneCheck({ onClick }: { onClick: () => void }) {
  const common = useTranslations("common")
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={common("done")}
      title={common("done")}
      className={sheetBlueGlassIconButtonClass}
    >
      <SfCheckIcon className="size-5" strokeWidth={2.6} />
    </button>
  )
}

function SheetRow({
  icon,
  label,
  value,
  onClick,
  href,
  chevron = true,
  destructive,
  divider,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  value?: React.ReactNode
  onClick?: () => void
  href?: string
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
        <SfChevronRightIcon
          className="size-4.5 shrink-0 text-foreground/25 rtl:rotate-180"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (href) {
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
  destructive,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  onClick?: () => void
  href?: string
  destructive?: boolean
}) {
  const className = cn(
    sheetPillClass,
    destructive && "text-destructive active:bg-destructive/8"
  )

  const body = (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </>
  )

  if (href) {
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
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  )
}

function NestedViewChrome({
  title,
  onDone,
  children,
}: {
  title: string
  onDone: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6">
      <div className="flex shrink-0 items-center gap-2 pb-3 pt-1">
        <h2 className="min-w-0 flex-1 truncate text-start text-[22px] font-normal tracking-tight text-foreground">
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
  const dir = localeDirection(useLocale())
  const pushSign: 1 | -1 = dir === "rtl" ? -1 : 1
  const popSign: 1 | -1 = dir === "rtl" ? 1 : -1

  const [view, setView] = React.useState<AccountSheetView>(initialView)
  const [enterFromSign, setEnterFromSign] = React.useState<1 | -1>(pushSign)
  const [openSnapshot, setOpenSnapshot] = React.useState(open)
  const [accountExpanded, setAccountExpanded] = React.useState(false)

  if (open !== openSnapshot) {
    setOpenSnapshot(open)
    if (open) {
      setView(initialView)
      setEnterFromSign(pushSign)
      setAccountExpanded(false)
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
    { id: "system" as const, label: common("themeSystem"), Icon: SfDesktopIcon },
    { id: "light" as const, label: common("themeLight"), Icon: SfSunIcon },
    { id: "dark" as const, label: common("themeDark"), Icon: SfMoonIcon },
  ] as const
  const currentTheme =
    themeOptions.find((option) => option.id === activeTheme) ?? themeOptions[0]
  const ThemeIcon = currentTheme.Icon

  const locale = useLocale() as AppLocale
  const currentLocaleLabel = common(localeLabelKey(locale))

  function switchLocale(next: AppLocale) {
    if (next === locale) return
    persistLocaleChoice(next)
    window.location.reload()
  }

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
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-0.5">
              <h2 className="min-w-0 flex-1 truncate text-start text-[22px] font-normal tracking-tight text-foreground">
                {t("accountSection")}
              </h2>
              <SheetDoneCheck onClick={closeSheet} />
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-1.5 pb-4">
              {user ? (
                /* Signed-in profile card — Switch account expands inside card */
                <div className={cn(sheetCardClass, "overflow-hidden")}>
                  <button
                    type="button"
                    aria-expanded={accountExpanded}
                    onClick={() => setAccountExpanded((v) => !v)}
                    className="flex w-full items-start gap-3.5 p-3.5 text-start transition-colors active:bg-black/2 dark:active:bg-white/4"
                  >
                    <ChatAccountAvatar
                      user={user}
                      avatarUrl={avatarUrl}
                      isProUser={isProUser}
                      planName={planName}
                      showPlanBadge
                      planBadgeClassName={cn(
                        "h-4 translate-y-[35%] px-1.5 text-[9px]",
                        isProUser
                          ? "border-background bg-[#1A73E8] text-white"
                          : "border-border/60 bg-background text-muted-foreground"
                      )}
                      avatarClassName="size-14"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[17px] font-semibold tracking-tight text-foreground">
                          {userAccountLabel(user)}
                        </span>
                        {email ? (
                          <span className="truncate text-[13px] text-muted-foreground">
                            {email}
                          </span>
                        ) : null}
                      </div>
                      {!isProUser ? (
                        <a
                          href={UPGRADE_PATH}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => {
                            event.stopPropagation()
                            closeSheet()
                          }}
                          className={sheetPrimaryPillClass}
                        >
                          <SfSparklesIcon className="size-3.5" aria-hidden />
                          {t("upgrade")}
                        </a>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/6 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-white/10",
                        accountExpanded && "rotate-180"
                      )}
                    >
                      <SfChevronDownIcon
                        className="size-4 text-foreground/55"
                        aria-hidden
                      />
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      accountExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          closeSheet()
                          void onSwitchAccount?.()
                        }}
                        className={cn(
                          "flex min-h-12 w-full items-center gap-3.5 border-t border-foreground/8 px-4 py-3 text-start text-[16px] font-medium tracking-[-0.01em] transition-[opacity,transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:bg-black/3 dark:border-white/10 dark:active:bg-white/6",
                          accountExpanded
                            ? "translate-y-0 opacity-100"
                            : "-translate-y-1 opacity-0"
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center">
                          <SfSwitchAccountIcon className={sheetIconClass} />
                        </span>
                        <span className="min-w-0 flex-1">
                          {t("switchAccount")}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    sheetCardClass,
                    "flex items-center gap-3.5 p-3.5"
                  )}
                >
                  <ChatGuestAvatar
                    avatarClassName="size-14"
                    badgeClassName="h-4 translate-y-[35%] px-1.5 text-[9px]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate ps-0.5 text-[17px] font-semibold tracking-tight">
                      {common("brand")}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      disabled={loginPending}
                      className={sheetPrimaryPillClass}
                      onClick={() => {
                        if (loginPending) return
                        closeSheet()
                        onLogin?.()
                      }}
                    >
                      {loginPending ? t("connecting") : t("signIn")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Primary actions — no Sign in / Switch / Upgrade duplicates */}
              <div className="flex flex-col gap-2.5 pt-1">
                {user ? (
                  <SheetPill
                    icon={<SfCreditCardIcon className={sheetIconClass} />}
                    label={t("billing")}
                    href={BILLING_PATH}
                    onClick={closeSheet}
                  />
                ) : null}

                <SheetPill
                  icon={<SfGearIcon className={sheetIconClass} />}
                  label={common("settings")}
                  onClick={() => go("settings")}
                />

                {onOpenNews ? (
                  <SheetPill
                    icon={<SfNewspaperIcon className={sheetIconClass} />}
                    label={t("news")}
                    onClick={() => {
                      closeSheet()
                      onOpenNews()
                    }}
                  />
                ) : null}

                {user ? (
                  <SheetPill
                    icon={<SfLogoutIcon className="size-5.5 shrink-0" />}
                    label={t("logOut")}
                    destructive
                    onClick={() => {
                      closeSheet()
                      void onLogout?.()
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

          {/* —— Settings (preferences / privacy / support only) —— */}
          <div data-view="settings" className="flex min-h-0 flex-1 flex-col">
            <NestedViewChrome
              title={t("exurSettings")}
              onDone={closeSheet}
            >
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
                  icon={<SfGlobeIcon className={sheetIconClass} />}
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
                  icon={<SfShieldIcon className={sheetIconClass} />}
                  label={t("helpPrivacy")}
                  href={privacyHref}
                  onClick={closeSheet}
                />
              </SheetCard>

              <p className={sheetSectionLabelClass}>
                {t("getSupportSection")}
              </p>
              <SheetCard>
                <SheetRow
                  icon={<SfQuestionCircleIcon className={sheetIconClass} />}
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
                      activeTheme === id ? <SelectionCheckBadge /> : null
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
                      value={active ? <SelectionCheckBadge /> : null}
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
            >
              <SheetCard>
                <SheetRow
                  icon={<SfQuestionCircleIcon className={sheetIconClass} />}
                  label={t("helpFaq")}
                  href={faqHref}
                  onClick={closeSheet}
                />
                <SheetRow
                  icon={<SfBookIcon className={sheetIconClass} />}
                  label={t("helpWhatIsExur")}
                  href={whatIsHref}
                  onClick={closeSheet}
                  divider
                />
                <SheetRow
                  icon={<SfDocTextIcon className={sheetIconClass} />}
                  label={t("helpTerms")}
                  href={termsHref}
                  onClick={closeSheet}
                  divider
                />
                <SheetRow
                  icon={<SfMailIcon className={sheetIconClass} />}
                  label={t("helpContact")}
                  href={`mailto:${CONTACT_EMAIL}`}
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
