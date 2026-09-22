"use client"

import { CheckIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { LocaleFlag } from "@/components/i18n/locale-flag"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPathname, usePathname } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"
import { localeLabelKey, persistLocaleChoice } from "@/lib/i18n/locale"
import {
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type LocaleSwitcherProps = {
  variant?: "icon" | "chip"
  className?: string
  buttonClassName?: string
}

export function LocaleSwitcher({
  variant = "icon",
  className,
  buttonClassName,
}: LocaleSwitcherProps) {
  const t = useTranslations("common")
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const isIcon = variant === "icon"

  function switchLocale(next: AppLocale) {
    if (next === locale) return

    persistLocaleChoice(next)
    const nextPath = getPathname({ locale: next, href: pathname })
    const { search, hash } = window.location
    // Hard reload so html dir, cookies, and desk state reset cleanly after locale switch.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full navigation
    window.location.assign(`${nextPath}${search}${hash}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={className}
        render={
          <Button
            type="button"
            variant="ghost"
            size={isIcon ? "icon" : "sm"}
            className={cn(
              isIcon
                ? "size-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground"
                : "h-8 gap-1.5 rounded-xl px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
              buttonClassName
            )}
            aria-label={t("language")}
          />
        }
      >
        <LocaleFlag
          locale={locale}
          tone="color"
          className={isIcon ? "size-4" : "size-3.5"}
        />
        {!isIcon ? (
          <span className="text-xs font-medium uppercase">{locale}</span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          landingGlassSurface,
          "w-auto min-w-[13rem] rounded-2xl border-0 bg-white/78 p-1.5 ring-0",
          "shadow-[0_22px_60px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(255,255,255,0.28)]",
          "dark:bg-background/82 dark:shadow-[0_22px_60px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]"
        )}
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
        {routing.locales.map((code) => {
          const active = locale === code
          const label = t(localeLabelKey(code))
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => switchLocale(code)}
              className={cn(
                "relative z-10 gap-2.5 rounded-xl px-2.5 py-2",
                active
                  ? "bg-white font-semibold text-foreground shadow-[0_2px_10px_rgba(15,23,42,0.07)] focus:bg-white dark:bg-white/12 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] dark:focus:bg-white/12"
                  : "font-medium text-muted-foreground focus:bg-white/55 focus:text-foreground dark:focus:bg-white/8"
              )}
            >
              <LocaleFlag
                locale={code}
                title={label}
                tone={active ? "color" : "mono"}
                className="size-5"
              />
              <span className="flex-1 text-[13px] tracking-[-0.01em]">
                {label}
              </span>
              {active ? (
                <CheckIcon className="size-3.5 text-[#2563EB]" />
              ) : (
                <span className="size-3.5 shrink-0" aria-hidden />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
