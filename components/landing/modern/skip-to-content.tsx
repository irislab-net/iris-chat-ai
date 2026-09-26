"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

const MAIN_CONTENT_ID = "main-content"

/** First focusable control — jumps keyboard/screen-reader users past the sticky nav. */
export function SkipToContent({ className }: { className?: string }) {
  const t = useTranslations("nav")

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:inset-4 focus:top-4 focus:z-100",
        "focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-background",
        "focus:ring-3 focus:ring-ring/50 focus:outline-none",
        className
      )}
    >
      {t("skipToContent")}
    </a>
  )
}

export { MAIN_CONTENT_ID }
