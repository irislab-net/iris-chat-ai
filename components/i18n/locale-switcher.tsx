"use client"

import { CheckIcon, LanguagesIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPathname, usePathname } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"
import { persistLocaleChoice } from "@/lib/i18n/locale"
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
                ? "size-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground [&_svg:not([class*='size-'])]:size-4"
                : "h-8 gap-1.5 rounded-xl px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
              buttonClassName
            )}
            aria-label={t("language")}
          />
        }
      >
        <LanguagesIcon className={isIcon ? "size-4" : "size-3.5"} />
        {!isIcon ? (
          <span className="text-xs font-medium uppercase">{locale}</span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36 rounded-xl">
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            className="gap-2"
            onClick={() => switchLocale(code)}
          >
            <span className="flex-1">
              {code === "ar" ? t("arabic") : t("english")}
            </span>
            {locale === code ? (
              <CheckIcon className="size-3.5 text-foreground" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
