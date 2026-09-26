"use client"

import { useLocale } from "next-intl"
import type { ReactNode } from "react"

import { LandingFooterLazy } from "@/components/landing/modern/landing-footer-lazy"
import { LandingNav } from "@/components/landing/modern/landing-nav"
import { LandingScrollProvider } from "@/components/landing/modern/landing-scroll-context"
import {
  SkipToContent,
  MAIN_CONTENT_ID,
} from "@/components/landing/modern/skip-to-content"
import { plusJakarta } from "@/components/landing/modern/fonts"
import { localeDirection } from "@/lib/i18n/locale"
import { landingPageStack, landingShell } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

import "@/app/styles/landing-modern.css"

/**
 * Shared marketing chrome for About / legal / SEO pages —
 * same shell, type, and footer language as the landing.
 */
export function MarketingPageShell({ children }: { children: ReactNode }) {
  const locale = useLocale()
  const dir = localeDirection(locale)
  const isRtl = dir === "rtl"

  const displayFont = isRtl
    ? '"IRIS Sans"'
    : (plusJakarta.style.fontFamily.split(",")[0]?.trim() ??
      '"Plus Jakarta Sans"')

  const fontVariables = isRtl ? undefined : plusJakarta.variable

  return (
    <LandingScrollProvider>
      <div
        dir={dir}
        className={cn(
          fontVariables,
          "landing-modern min-h-dvh bg-background text-foreground antialiased selection:bg-foreground/10 selection:text-foreground",
          isRtl ? "font-sans" : null
        )}
        style={{
          ["--font-display" as string]: displayFont,
          ...(isRtl
            ? {}
            : {
                ["--font-sans" as string]: displayFont,
                fontFamily: `var(--font-display), ${displayFont}, ui-sans-serif, system-ui, sans-serif`,
              }),
        }}
      >
        <SkipToContent />
        <div
          className={cn(
            landingShell,
            landingPageStack,
            "relative z-10 pb-3 sm:pb-5 lg:pb-8"
          )}
        >
          <LandingNav />
          <main id={MAIN_CONTENT_ID} className="min-w-0">
            {children}
          </main>
          <LandingFooterLazy />
        </div>
      </div>
    </LandingScrollProvider>
  )
}
