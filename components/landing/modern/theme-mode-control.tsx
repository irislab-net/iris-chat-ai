"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ThemeChoice = "system" | "light" | "dark"

const CHOICES: {
  value: ThemeChoice
  icon: typeof MonitorIcon
  labelKey: "themeSystem" | "themeLight" | "themeDark"
}[] = [
  { value: "system", icon: MonitorIcon, labelKey: "themeSystem" },
  { value: "light", icon: SunIcon, labelKey: "themeLight" },
  { value: "dark", icon: MoonIcon, labelKey: "themeDark" },
]

/**
 * System / Light / Dark segmented control.
 *
 * Default app preference is system (`ThemeProvider`). This writes the same
 * storage key the rest of the product reads, so the choice carries into the app.
 */
export function ThemeModeControl({ className }: { className?: string }) {
  const t = useTranslations("common")
  const { theme, setTheme } = useTheme()
  const active: ThemeChoice =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system"

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      className={cn(
        "grid grid-cols-3 gap-1 rounded-full bg-muted p-1",
        className
      )}
    >
      {CHOICES.map(({ value, icon: Icon, labelKey }) => {
        const selected = active === value
        return (
          <Button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(labelKey)}
            variant="ghost"
            onClick={() => setTheme(value)}
            className={cn(
              "h-9 gap-1.5 rounded-full px-2 text-xs font-medium",
              selected
                ? "bg-card text-foreground shadow-[0_2px_8px_rgba(15,23,42,0.08)] hover:bg-card hover:text-foreground dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-muted-foreground hover:bg-transparent hover:text-foreground"
            )}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="hidden min-[360px]:inline">{t(labelKey)}</span>
          </Button>
        )
      })}
    </div>
  )
}
