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
  chatComposerLiquidSheetRowClass,
  chatComposerLiquidSheetRowIconClass,
  chatMobilePrimaryButtonClass,
  chatMobileSheetPrimaryButtonClass,
  chatUpgradePillClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import {
  landingGlassSheen,
  landingGlassSurface,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { LocaleFlag } from "@/components/i18n/locale-flag"
import { TradingProfileForm } from "@/components/app-shell/trading-profile-form"
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
  SfPersonCircleIcon,
  SfQuestionCircleIcon,
  SfShieldIcon,
  SfSparklesIcon,
  SfSunIcon,
  SfSwitchAccountIcon,
} from "@/components/icons/sf-menu-icons"
import { SelectionCheckBadge } from "@/components/ui/selection-check-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { Link } from "@/i18n/navigation"
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
import { readTradingProfile } from "@/lib/trading-profile"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

const CONTACT_EMAIL = "hello@exur.ai"

/**
 * Frosted glass canvas — same family as working `/` mention listbox.
 * Blur is applied via Sheet's inner `[data-slot=sheet-surface].chat-sheet-glass`
 * (not on the translating shell) so Safari keeps the glass.
 */
const sheetCanvasClass = [
  "gap-0 border-0 bg-white/90 text-foreground",
  "shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_92%,transparent),inset_0_0_0_1px_color-mix(in_oklch,white_40%,transparent),0_-18px_52px_-18px_color-mix(in_oklch,var(--foreground)_18%,transparent)]",
  "backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/72",
  "dark:bg-[oklch(0.22_0_0_/0.92)] dark:supports-[backdrop-filter]:bg-[oklch(0.2_0_0_/0.72)]",
  "dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_14%,transparent),inset_0_0_0_1px_color-mix(in_oklch,white_8%,transparent),0_-18px_52px_-18px_color-mix(in_oklch,black_55%,transparent)]",
].join(" ")

const sheetHandleClass =
  "mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-foreground/15 dark:bg-white/20"

/** Profile / grouped cards — landing liquid glass (same family as site chrome). */
const sheetCardClass = cn(
  landingGlassSurface,
  "rounded-3xl bg-white/48 dark:bg-white/10"
)

/**
 * Root menu rows — same liquid rows as composer tools / mention sheet.
 * Icon sits in a frosted disc so the list matches site glass language.
 */
const sheetPillClass = cn(
  chatComposerLiquidSheetRowClass,
  "min-h-14 gap-3.5 px-3.5 text-[15px] font-medium tracking-[-0.016em]"
)

const sheetPrimaryPillClass = cn(
  chatUpgradePillClass,
  "inline-flex h-8 w-fit items-center justify-center gap-1.5 px-3.5 text-[13px] font-semibold"
)

/** Blue liquid-glass Done — tinted glass circle, white check. */
const sheetDoneCheckClass = cn(
  chatMobilePrimaryButtonClass,
  "chat-ios26-liquid-glass relative isolate size-9 shrink-0 overflow-hidden rounded-full px-0 text-white hover:text-white"
)

const sheetRowClass = cn(
  chatComposerLiquidSheetRowClass,
  "min-h-13 gap-3 px-3.5 text-[15px] font-medium tracking-[-0.016em]"
)

const sheetSectionLabelClass =
  "px-3.5 pb-1.5 pt-4 text-[12px] font-medium tracking-[0.01em] text-muted-foreground first:pt-1"

const sheetIconClass = "size-4.5 shrink-0 text-foreground/80"

type AccountSheetView =
  | "root"
  | "settings"
  | "theme"
  | "language"
  | "help"
  | "tradingProfile"

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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={common("done")}
      title={common("done")}
      className={sheetDoneCheckClass}
    >
      <SfCheckIcon className="size-4.5 stroke-[2.4] text-white" />
    </Button>
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
  // `divider` kept for call-site compat — rows are separate liquid pills now.
  void divider
  const className = cn(
    sheetRowClass,
    destructive && "text-destructive"
  )

  const body = (
    <>
      <span className={chatComposerLiquidSheetRowIconClass}>{icon}</span>
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
          className="size-4 shrink-0 text-muted-foreground/50 rtl:rotate-180"
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

/**
 * Nested settings stack — each child row is its own liquid pill (same as root
 * Account menu). Avoid wrapping rows in a second glass card.
 */
function SheetCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>
  )
}

function SheetPill({
  icon,
  label,
  onClick,
  href,
  external,
  destructive,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  onClick?: () => void
  href?: string
  external?: boolean
  destructive?: boolean
}) {
  const className = cn(
    sheetPillClass,
    destructive && "text-destructive active:bg-destructive/8"
  )

  const body = (
    <>
      <span
        className={cn(
          chatComposerLiquidSheetRowIconClass,
          destructive && "text-destructive"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-start">{label}</span>
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
        <h2
          className={cn(
            landingTitleCard,
            "min-w-0 flex-1 truncate text-start text-[22px]"
          )}
        >
          {title}
        </h2>
        <SheetDoneCheck onClick={onDone} />
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
}

/**
 * Profile / settings surface — bottom sheet on mobile, centered dialog on
 * desktop (incl. Windows). Gemini-style cards with GSAP push navigation.
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
  const isDesktop = useIsDesktop()
  const dir = localeDirection(useLocale())
  const pushSign: 1 | -1 = dir === "rtl" ? -1 : 1
  const popSign: 1 | -1 = dir === "rtl" ? 1 : -1

  const [view, setView] = React.useState<AccountSheetView>(initialView)
  const [, setViewStack] = React.useState<AccountSheetView[]>([])
  const [enterFromSign, setEnterFromSign] = React.useState<1 | -1>(pushSign)
  const [openSnapshot, setOpenSnapshot] = React.useState(open)
  const [accountExpanded, setAccountExpanded] = React.useState(false)

  if (open !== openSnapshot) {
    setOpenSnapshot(open)
    if (open) {
      setView(initialView)
      setViewStack([])
      setEnterFromSign(pushSign)
      setAccountExpanded(false)
    }
  }

  const go = React.useCallback(
    (next: AccountSheetView) => {
      setEnterFromSign(pushSign)
      setViewStack((stack) => [...stack, view])
      setView(next)
    },
    [pushSign, view]
  )

  const closeSheet = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  /** Nested Done check — pop one level; never dismiss the whole sheet. */
  const goBack = React.useCallback(() => {
    setViewStack((stack) => {
      const prev = stack[stack.length - 1]
      setEnterFromSign(popSign)
      setView(prev ?? "root")
      return stack.slice(0, -1)
    })
  }, [popSign])

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
    // Side panel has no locale-prefixed routes — reload to remount providers.
    window.location.reload()
  }

  const faqHref = `${getMarketingPageHref(getMarketingHomePath())}#faq`
  const whatIsHref = getMarketingPageHref("/what-is-exur")
  const termsHref = getTermsOfServiceHref()
  const privacyHref = getPrivacyNoticeHref()

  const email = user?.email?.trim() || (user ? userAccountSubline(user) : "")

  if (isDesktop === null) return null

  const a11yTitle =
    view === "root"
      ? t("accountMenuFor", {
          name: user ? userAccountLabel(user) : t("signIn"),
        })
      : view === "tradingProfile"
        ? t("tradingProfile.title")
        : t("exurSettings")

  const stack = (
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
              <h2
                className={cn(
                  landingTitleCard,
                  "min-w-0 flex-1 truncate text-start text-[22px]"
                )}
              >
                {t("accountSection")}
              </h2>
              <SheetDoneCheck onClick={closeSheet} />
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-1.5 pb-4">
              {user ? (
                /* Signed-in profile card — Switch account expands inside card */
                <div className={cn(sheetCardClass, "overflow-hidden")}>
                  <span
                    aria-hidden
                    className={cn(landingGlassSheen, "rounded-3xl")}
                  />
                  <button
                    type="button"
                    aria-expanded={accountExpanded}
                    onClick={() => setAccountExpanded((v) => !v)}
                    className="relative z-10 flex w-full items-start gap-3.5 p-3.5 text-start transition-colors active:bg-black/2 dark:active:bg-white/4"
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
                        <Link
                          href={UPGRADE_PATH}
                          onClick={(event) => {
                            event.stopPropagation()
                            closeSheet()
                          }}
                          className={sheetPrimaryPillClass}
                        >
                          <SfSparklesIcon className="size-3.5" aria-hidden />
                          {t("upgrade")}
                        </Link>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        chatComposerLiquidSheetRowIconClass,
                        "mt-1 size-8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                        accountExpanded && "rotate-180"
                      )}
                    >
                      <SfChevronDownIcon
                        className="size-3.5 text-foreground/55"
                        aria-hidden
                      />
                    </span>
                  </button>

                  <div
                    className={cn(
                      "relative z-10 grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
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
                          "flex min-h-12 w-full items-center gap-3 border-t border-foreground/8 px-3.5 py-3 text-start text-[15px] font-medium tracking-[-0.016em] transition-[opacity,transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:bg-black/3 dark:border-white/10 dark:active:bg-white/6",
                          accountExpanded
                            ? "translate-y-0 opacity-100"
                            : "-translate-y-1 opacity-0"
                        )}
                      >
                        <span className={chatComposerLiquidSheetRowIconClass}>
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
                    "relative flex items-center gap-3.5 overflow-hidden p-3.5"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(landingGlassSheen, "rounded-3xl")}
                  />
                  <ChatGuestAvatar
                    avatarClassName="relative z-10 size-14"
                    showBadge={false}
                  />
                  <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-[17px] font-semibold tracking-tight text-foreground">
                      {t("guest")}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {common("brand")}
                    </p>
                  </div>
                </div>
              )}

              {/* Primary actions — liquid rows (same family as Exur tools) */}
              <div className="flex flex-col gap-1.5 pt-1">
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

                <SheetPill
                  icon={<SfPersonCircleIcon className={sheetIconClass} />}
                  label={t("tradingProfile.menuLabel")}
                  onClick={() => go("tradingProfile")}
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

            {!user ? (
              <div className="mt-auto shrink-0 px-4 pb-2 pt-1">
                <Button
                  type="button"
                  disabled={loginPending}
                  className={chatMobileSheetPrimaryButtonClass}
                  onClick={() => {
                    if (loginPending) return
                    closeSheet()
                    onLogin?.()
                  }}
                >
                  {loginPending ? t("connecting") : t("signIn")}
                </Button>
              </div>
            ) : null}

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
              onDone={goBack}
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
                <SheetRow
                  icon={<SfPersonCircleIcon className={sheetIconClass} />}
                  label={t("tradingProfile.menuLabel")}
                  onClick={() => go("tradingProfile")}
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
              onDone={goBack}
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
              onDone={goBack}
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
              onDone={goBack}
            >
              <SheetCard>
                <SheetRow
                  icon={<SfQuestionCircleIcon className={sheetIconClass} />}
                  label={t("helpFaq")}
                  href={faqHref}
                  external
                  onClick={closeSheet}
                />
                <SheetRow
                  icon={<SfBookIcon className={sheetIconClass} />}
                  label={t("helpWhatIsExur")}
                  href={whatIsHref}
                  external
                  onClick={closeSheet}
                  divider
                />
                <SheetRow
                  icon={<SfDocTextIcon className={sheetIconClass} />}
                  label={t("helpTerms")}
                  href={termsHref}
                  external
                  onClick={closeSheet}
                  divider
                />
                <SheetRow
                  icon={<SfMailIcon className={sheetIconClass} />}
                  label={t("helpContact")}
                  href={`mailto:${CONTACT_EMAIL}`}
                  external
                  onClick={closeSheet}
                  divider
                />
              </SheetCard>
            </NestedViewChrome>
          </div>

          {/* —— Trading profile (silent client_context prefs) —— */}
          <div
            data-view="tradingProfile"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <TradingProfileForm
              key={
                view === "tradingProfile"
                  ? "trading-profile-active"
                  : "trading-profile-idle"
              }
              title={t("tradingProfile.title")}
              onDone={goBack}
              initialProfile={readTradingProfile()}
              onSaved={goBack}
            />
          </div>
        </ChatGsapViewStack>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          gsapMotion
          open={open}
          className={cn(
            sheetCanvasClass,
            "flex h-[min(85dvh,640px)] max-h-[min(85dvh,640px)] min-h-0 w-full flex-col overflow-hidden rounded-3xl p-0 pt-3 pb-4 sm:max-w-104"
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{a11yTitle}</DialogTitle>
          </DialogHeader>
          {stack}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          sheetCanvasClass,
          // Fixed canvas height required — inner stack is flex-1 and collapses without it.
          "flex h-[min(90dvh,720px)] min-h-0 flex-col overflow-hidden rounded-t-[28px] pt-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))] data-[side=bottom]:h-[min(90dvh,720px)]"
        )}
      >
        <div aria-hidden className={sheetHandleClass} />
        <SheetHeader className="sr-only">
          <SheetTitle>{a11yTitle}</SheetTitle>
        </SheetHeader>
        {stack}
      </SheetContent>
    </Sheet>
  )
}

export { ChatAccountSheet }
export type { AccountSheetView, ChatAccountSheetProps }
