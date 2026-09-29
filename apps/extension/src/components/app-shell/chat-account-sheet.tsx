"use client"

import * as React from "react"
import {
  BookOpenIcon,
  CheckIcon,
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
import {
  chatContextMenuDeleteClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import {
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { LocaleFlag } from "@/components/i18n/locale-flag"
import { openCookieSettings } from "@/components/privacy/cookie-consent-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { Link, getPathname, usePathname } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"
import type { User } from "@/lib/api/types"
import { localeDirection, localeLabelKey, persistLocaleChoice } from "@/lib/i18n/locale"
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

type AccountSheetView =
  | "root"
  | "settings"
  | "theme"
  | "language"
  | "help"

type ChatAccountSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Open directly on a nested view (e.g. history gear → settings). */
  initialView?: AccountSheetView
  user: User | null
  isProUser: boolean
  planName: string
  avatarUrl: string | null
  loginPending?: boolean
  onLogin?: () => void
  onLogout?: () => void | Promise<void>
  onOpenNews?: () => void
}

function AccountSheetRow({
  icon,
  label,
  value,
  onClick,
  href,
  external,
  destructive,
  chevron,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  value?: React.ReactNode
  onClick?: () => void
  href?: string
  external?: boolean
  destructive?: boolean
  chevron?: boolean
}) {
  const className = cn(
    chatContextMenuItemClass,
    "flex w-full items-center gap-3 text-start",
    destructive && chatContextMenuDeleteClass
  )

  const body = (
    <>
      {icon}
      <span className="min-w-0 flex-1">{label}</span>
      {value ? (
        <span className="flex max-w-32 shrink-0 items-center justify-end gap-1.5 truncate text-xs text-muted-foreground">
          {value}
        </span>
      ) : null}
      {chevron ? (
        <ChevronRightIcon
          className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
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

function AccountSheetSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1 py-1", className)}>{children}</div>
  )
}

function AccountSheetNavHeader({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  const common = useTranslations("common")
  return (
    <div className="flex items-center gap-1 px-2 pb-2 pt-1">
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
      <h3 className="min-w-0 flex-1 truncate text-[17px] font-medium tracking-tight">
        {title}
      </h3>
    </div>
  )
}

/**
 * Mobile profile / settings bottom sheet with GSAP push navigation.
 * Views: root → settings → theme | language; help is a sibling of settings.
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

  const isEligible = false
  const needsManualInstall = false
  const promptInstall = async () => {}

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
          chatMobileSheetContentClass,
          "flex h-[min(88dvh,680px)] flex-col overflow-hidden pb-0"
        )}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className="sr-only">
          <SheetTitle>
            {view === "root" ? t("accountMenuFor", { name: user ? userAccountLabel(user) : t("signIn") }) : common("settings")}
          </SheetTitle>
        </SheetHeader>

        <ChatGsapViewStack
          active={view}
          enterFromSign={enterFromSign}
          className="min-h-0 flex-1"
        >
          {/* —— Root profile menu —— */}
          <div
            data-view="root"
            className={cn(chatMobileSheetBodyClass, "overflow-y-auto pb-6")}
          >
            {user ? (
              <div className="mb-3 flex items-start justify-between gap-3 px-1 pt-1">
                <div className="flex min-w-0 items-center gap-3">
                  <ChatAccountAvatar
                    user={user}
                    avatarUrl={avatarUrl}
                    isProUser={isProUser}
                    planName={planName}
                    showPlanBadge={false}
                    avatarClassName="size-12"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[17px] font-medium tracking-tight">
                      {userAccountLabel(user)}
                    </span>
                    {email ? (
                      <span className="truncate text-[13px] text-muted-foreground">
                        {email}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Badge
                  variant={isProUser ? "default" : "secondary"}
                  className={cn(
                    "h-5 shrink-0 px-1.5 text-[10px] font-semibold tracking-wide",
                    isProUser && "border-0 bg-[#2563EB] text-white"
                  )}
                >
                  {isProUser ? (
                    <SparklesIcon className="size-2.5" aria-hidden />
                  ) : null}
                  {planName}
                </Badge>
              </div>
            ) : (
              <div className={cn(chatMobileSheetHeaderClass, "px-1")}>
                <p className={chatMobileSheetTitleClass}>{common("brand")}</p>
              </div>
            )}

            <AccountSheetSection>
              {user && !isProUser ? (
                <AccountSheetRow
                  icon={
                    <SparklesIcon className={chatContextMenuIconClass} />
                  }
                  label={t("upgradeToPlus")}
                  href={UPGRADE_PATH}
                  onClick={closeSheet}
                />
              ) : null}
              {user ? (
                <AccountSheetRow
                  icon={<ReceiptIcon className={chatContextMenuIconClass} />}
                  label={t("billing")}
                  href={BILLING_PATH}
                  onClick={closeSheet}
                />
              ) : null}
              {onOpenNews ? (
                <AccountSheetRow
                  icon={
                    <NewspaperIcon className={chatContextMenuIconClass} />
                  }
                  label={t("news")}
                  onClick={() => {
                    closeSheet()
                    onOpenNews()
                  }}
                />
              ) : null}
            </AccountSheetSection>

            <AccountSheetSection>
              <AccountSheetRow
                icon={<SettingsIcon className={chatContextMenuIconClass} />}
                label={common("settings")}
                chevron
                onClick={() => go("settings")}
              />
              {isEligible ? (
                <AccountSheetRow
                  icon={
                    <SmartphoneIcon className={chatContextMenuIconClass} />
                  }
                  label={
                    needsManualInstall ? t("addToHomeScreen") : t("installApp")
                  }
                  onClick={() => {
                    void promptInstall()
                  }}
                />
              ) : null}
              <AccountSheetRow
                icon={
                  <CircleHelpIcon className={chatContextMenuIconClass} />
                }
                label={t("help")}
                chevron
                onClick={() => go("help")}
              />
            </AccountSheetSection>

            <AccountSheetSection>
              {user ? (
                <AccountSheetRow
                  icon={<LogOutIcon className="size-4.5 shrink-0" />}
                  label={t("logOut")}
                  destructive
                  onClick={() => {
                    closeSheet()
                    void onLogout?.()
                  }}
                />
              ) : (
                <AccountSheetRow
                  icon={<GoogleGlyph className="size-4 shrink-0" />}
                  label={loginPending ? t("connecting") : t("signIn")}
                  onClick={() => {
                    if (loginPending) return
                    closeSheet()
                    onLogin?.()
                  }}
                />
              )}
            </AccountSheetSection>
          </div>

          {/* —— Settings —— */}
          <div
            data-view="settings"
            className={cn(chatMobileSheetBodyClass, "overflow-y-auto pb-6")}
          >
            <AccountSheetNavHeader
              title={common("settings")}
              onBack={() => go("root", "pop")}
            />
            <AccountSheetSection>
              <AccountSheetRow
                icon={<ThemeIcon className={chatContextMenuIconClass} />}
                label={common("theme")}
                value={currentTheme.label}
                chevron
                onClick={() => go("theme")}
              />
              <AccountSheetRow
                icon={<LanguagesIcon className={chatContextMenuIconClass} />}
                label={common("language")}
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <LocaleFlag
                      locale={locale}
                      tone="color"
                      className="size-3.5"
                    />
                    {currentLocaleLabel}
                  </span>
                }
                chevron
                onClick={() => go("language")}
              />
              <AccountSheetRow
                icon={<CookieIcon className={chatContextMenuIconClass} />}
                label={consent("manageTitle")}
                onClick={() => {
                  closeSheet()
                  openCookieSettings()
                }}
              />
            </AccountSheetSection>
          </div>

          {/* —— Theme —— */}
          <div
            data-view="theme"
            className={cn(chatMobileSheetBodyClass, "overflow-y-auto pb-6")}
          >
            <AccountSheetNavHeader
              title={common("theme")}
              onBack={() => go("settings", "pop")}
            />
            <AccountSheetSection>
              {themeOptions.map(({ id, label, Icon }) => (
                <AccountSheetRow
                  key={id}
                  icon={<Icon className={chatContextMenuIconClass} />}
                  label={label}
                  value={
                    activeTheme === id ? (
                      <CheckIcon
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                    ) : null
                  }
                  onClick={() => setTheme(id)}
                />
              ))}
            </AccountSheetSection>
          </div>

          {/* —— Language —— */}
          <div
            data-view="language"
            className={cn(chatMobileSheetBodyClass, "overflow-y-auto pb-6")}
          >
            <AccountSheetNavHeader
              title={common("language")}
              onBack={() => go("settings", "pop")}
            />
            <AccountSheetSection>
              {routing.locales.map((code) => {
                const active = locale === code
                const label = common(localeLabelKey(code))
                return (
                  <AccountSheetRow
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
                    value={
                      active ? (
                        <CheckIcon
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                      ) : null
                    }
                    onClick={() => switchLocale(code)}
                  />
                )
              })}
            </AccountSheetSection>
          </div>

          {/* —— Help —— */}
          <div
            data-view="help"
            className={cn(chatMobileSheetBodyClass, "overflow-y-auto pb-6")}
          >
            <AccountSheetNavHeader
              title={t("help")}
              onBack={() => go("root", "pop")}
            />
            <AccountSheetSection>
              <AccountSheetRow
                icon={
                  <CircleHelpIcon className={chatContextMenuIconClass} />
                }
                label={t("helpFaq")}
                href={faqHref}
                external
                onClick={closeSheet}
              />
              <AccountSheetRow
                icon={<BookOpenIcon className={chatContextMenuIconClass} />}
                label={t("helpWhatIsExur")}
                href={whatIsHref}
                external
                onClick={closeSheet}
              />
              <AccountSheetRow
                icon={<FileTextIcon className={chatContextMenuIconClass} />}
                label={t("helpTerms")}
                href={termsHref}
                external
                onClick={closeSheet}
              />
              <AccountSheetRow
                icon={<ShieldIcon className={chatContextMenuIconClass} />}
                label={t("helpPrivacy")}
                href={privacyHref}
                external
                onClick={closeSheet}
              />
              <AccountSheetRow
                icon={<MailIcon className={chatContextMenuIconClass} />}
                label={t("helpContact")}
                href={`mailto:${CONTACT_EMAIL}`}
                external
                onClick={closeSheet}
              />
            </AccountSheetSection>
          </div>
        </ChatGsapViewStack>
      </SheetContent>
    </Sheet>
  )
}

export { ChatAccountSheet }
export type { AccountSheetView, ChatAccountSheetProps }
