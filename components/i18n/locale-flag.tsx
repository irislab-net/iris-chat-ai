"use client"

import type { ComponentType } from "react"
import { BR, ES, IR, NL, RU, SA, TR, US } from "country-flag-icons/react/1x1"

import type { AppLocale } from "@/i18n/routing"
import { localeFlagCode, type LocaleFlagCode } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

type FlagProps = {
  title?: string
  className?: string
  "aria-hidden"?: boolean | "true" | "false"
  /** Country-flag-icons SVGs accept standard SVG attrs; omit XML ns in HTML5. */
  xmlns?: string
}

const FLAGS: Record<LocaleFlagCode, ComponentType<FlagProps>> = {
  US,
  NL,
  BR,
  ES,
  SA,
  IR,
  RU,
  TR,
}

type LocaleFlagProps = {
  locale: AppLocale
  /** Active locale keeps full color; others stay ink grayscale. */
  tone?: "mono" | "color"
  className?: string
  title?: string
}

/** Circular country flag — mono by default, full color when selected. */
export function LocaleFlag({
  locale,
  tone = "mono",
  className,
  title,
}: LocaleFlagProps) {
  const code = localeFlagCode(locale)
  const Flag = FLAGS[code]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full",
        "ring-1 ring-black/6 dark:ring-white/10",
        className
      )}
    >
      <Flag
        title={title}
        aria-hidden={title ? undefined : true}
        // HTML5 SVG — omit XML namespace so scanners don't treat it as http://.
        xmlns={undefined}
        className={cn(
          "size-full",
          tone === "mono" && "contrast-[1.05] grayscale"
        )}
      />
    </span>
  )
}
