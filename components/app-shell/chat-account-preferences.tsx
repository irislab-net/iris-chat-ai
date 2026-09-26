"use client"

import {
  CheckIcon,
  CookieIcon,
  LanguagesIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import {
  chatContextMenuContentClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import { LocaleFlag } from "@/components/i18n/locale-flag"
import { openCookieSettings } from "@/components/privacy/cookie-consent-banner"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { getPathname, usePathname } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"
import { localeLabelKey, persistLocaleChoice } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

function useAccountLocaleSwitch() {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()

  return {
    locale,
    switchLocale(next: AppLocale) {
      if (next === locale) return
      persistLocaleChoice(next)
      const nextPath = getPathname({ locale: next, href: pathname })
      const { search, hash } = window.location
      // Hard reload so html dir, cookies, and desk state reset cleanly after locale switch.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full navigation
      window.location.assign(`${nextPath}${search}${hash}`)
    },
  }
}

function useThemeOptions() {
  const common = useTranslations("common")
  const { theme, setTheme } = useTheme()
  const active =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system"

  const options = [
    { id: "system" as const, label: common("themeSystem"), Icon: MonitorIcon },
    { id: "light" as const, label: common("themeLight"), Icon: SunIcon },
    { id: "dark" as const, label: common("themeDark"), Icon: MoonIcon },
  ] as const

  const current = options.find((option) => option.id === active) ?? options[0]

  return { active, options, current, setTheme, common }
}

/** Theme flyout — matches Language submenu pattern. */
function AccountThemeItems() {
  const { active, options, current, setTheme, common } = useThemeOptions()
  const CurrentIcon = current.Icon

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={cn(chatContextMenuItemClass, "gap-3")}>
        <CurrentIcon className={chatContextMenuIconClass} />
        <span className="flex-1 text-start">{common("theme")}</span>
        <span className="max-w-20 truncate text-xs text-muted-foreground">
          {current.label}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        className={cn(chatContextMenuContentClass, "min-w-44")}
        sideOffset={8}
      >
        {options.map(({ id, label, Icon }) => (
          <DropdownMenuItem
            key={id}
            className={chatContextMenuItemClass}
            onClick={() => setTheme(id)}
          >
            <Icon className={chatContextMenuIconClass} />
            <span className="flex-1">{label}</span>
            {active === id ? (
              <CheckIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

function AccountLanguageItems() {
  const common = useTranslations("common")
  const { locale, switchLocale } = useAccountLocaleSwitch()
  const currentLabel = common(localeLabelKey(locale))

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={cn(chatContextMenuItemClass, "gap-3")}>
        <LanguagesIcon className={chatContextMenuIconClass} />
        <span className="flex-1 text-start">{common("language")}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LocaleFlag locale={locale} tone="color" className="size-3.5" />
          <span className="max-w-16 truncate">{currentLabel}</span>
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        className={cn(chatContextMenuContentClass, "min-w-48")}
        sideOffset={8}
      >
        {routing.locales.map((code) => {
          const active = locale === code
          const label = common(localeLabelKey(code))
          return (
            <DropdownMenuItem
              key={code}
              className={chatContextMenuItemClass}
              onClick={() => switchLocale(code)}
            >
              <LocaleFlag
                locale={code}
                title={label}
                tone={active ? "color" : "mono"}
                className="size-5"
              />
              <span className="flex-1">{label}</span>
              {active ? (
                <CheckIcon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

function AccountCookieSettingsItem() {
  const t = useTranslations("consent")

  return (
    <DropdownMenuItem
      className={chatContextMenuItemClass}
      onClick={() => openCookieSettings()}
    >
      <CookieIcon className={chatContextMenuIconClass} />
      <span className="flex-1">{t("manageTitle")}</span>
    </DropdownMenuItem>
  )
}

/** Preferences block used across account menus. */
function AccountPreferencesGroup() {
  return (
    <DropdownMenuGroup>
      <AccountThemeItems />
      <AccountLanguageItems />
      <AccountCookieSettingsItem />
    </DropdownMenuGroup>
  )
}

export {
  AccountCookieSettingsItem,
  AccountLanguageItems,
  AccountPreferencesGroup,
  AccountThemeItems,
}
