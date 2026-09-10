"use client"

import { EclipseIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const navIconClass =
  "size-8 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground [&_svg:not([class*='size-'])]:size-4"

export function LandingNavActions() {
  const t = useTranslations("common")
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Landing">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(navIconClass, "rounded-xl")}
        aria-label={t("toggleTheme")}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <EclipseIcon />
      </Button>

      <LocaleSwitcher variant="icon" buttonClassName={cn(navIconClass, "rounded-xl")} />

      <Button
        className="h-9 rounded-xl px-4"
        nativeButton={false}
        render={<Link href={APP_NEWS_PATH} />}
      >
        {t("launchApp")}
      </Button>
    </nav>
  )
}
