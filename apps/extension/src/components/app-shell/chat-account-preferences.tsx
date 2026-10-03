"use client"

import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import {
  chatContextMenuContentClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import { LocaleFlag } from "@/components/i18n/locale-flag"
import {
  SfDesktopIcon,
  SfGlobeIcon,
  SfMoonIcon,
  SfSunIcon,
} from "@/components/icons/sf-menu-icons"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SelectionCheckBadge,
  SelectionCheckSpacer,
} from "@/components/ui/selection-check-badge"
import { routing, type AppLocale } from "@/i18n/routing"
import { localeLabelKey, persistLocaleChoice } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

function useAccountLocaleSwitch() {
  const locale = useLocale() as AppLocale

  return {
    locale,
    switchLocale(next: AppLocale) {
      if (next === locale) return
      persistLocaleChoice(next)
      // Side panel has no locale-prefixed routes — reload to remount providers.
      window.location.reload()
    },
  }
}

function useThemeOptions() {
  const common = useTranslations("common")
  const { theme, setTheme } = useTheme()
  const active =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system"

  const options = [
    { id: "system" as const, label: common("themeSystem"), Icon: SfDesktopIcon },
    { id: "light" as const, label: common("themeLight"), Icon: SfSunIcon },
    { id: "dark" as const, label: common("themeDark"), Icon: SfMoonIcon },
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
              <SelectionCheckBadge />
            ) : (
              <SelectionCheckSpacer />
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
        <SfGlobeIcon className={chatContextMenuIconClass} />
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
              {active ? <SelectionCheckBadge /> : <SelectionCheckSpacer />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

/** Preferences block used across account menus. */
function AccountPreferencesGroup() {
  return (
    <DropdownMenuGroup>
      <AccountThemeItems />
      <AccountLanguageItems />
    </DropdownMenuGroup>
  )
}

export {
  AccountLanguageItems,
  AccountPreferencesGroup,
  AccountThemeItems,
}
