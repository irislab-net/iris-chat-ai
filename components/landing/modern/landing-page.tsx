import { getLocale, getTranslations } from "next-intl/server"

import { HeroComposeDemoLazy } from "@/components/landing/modern/hero-compose-demo-lazy"
import { HeroLiquidGlassBgLazy } from "@/components/landing/modern/hero-liquid-glass-bg-lazy"
import { LandingBelowFold } from "@/components/landing/modern/landing-below-fold"
import { LandingFooterLazy } from "@/components/landing/modern/landing-footer-lazy"
import { LandingNav } from "@/components/landing/modern/landing-nav"
import { LandingScrollProvider } from "@/components/landing/modern/landing-scroll-context"
import { SkipToContent } from "@/components/landing/modern/skip-to-content"
import { jetbrainsMono, plusJakarta } from "@/components/landing/modern/fonts"
import { localeDirection } from "@/lib/i18n/locale"
import {
  landingHeroCard,
  landingHeroGlass,
  landingHeroToMain,
  landingInner,
  landingMainStack,
  landingPageStack,
  landingShell,
  landingTitleHero,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

import "@/app/styles/landing-modern.css"

const MAIN_CONTENT_ID = "main-content"

/**
 * Server-rendered marketing shell: LCP `h1` in the HTML response.
 * Motion-heavy sections mount as deferred client islands below the fold.
 */
export async function ModernLandingPage() {
  const locale = await getLocale()
  const t = await getTranslations("modern.hero")
  const dir = localeDirection(locale)
  const isRtl = dir === "rtl"

  // LTR: one critical face (Plus Jakarta for display + body).
  // RTL: IRIS Sans (Vazirmatn) for both — skip Jakarta download entirely.
  const displayFont = isRtl
    ? '"IRIS Sans"'
    : (plusJakarta.style.fontFamily.split(",")[0]?.trim() ??
      '"Plus Jakarta Sans"')

  const fontVariables = isRtl
    ? jetbrainsMono.variable
    : cn(plusJakarta.variable, jetbrainsMono.variable)

  return (
    <LandingScrollProvider>
      <div
        id="top"
        dir={dir}
        className={cn(
          fontVariables,
          "landing-modern min-h-dvh bg-background text-foreground antialiased selection:bg-foreground/10 selection:text-foreground",
          isRtl ? "font-sans" : null
        )}
        style={{
          ["--font-display" as string]: displayFont,
          // LTR: body uses the same face as the hero so Inter is never requested.
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

          <div id="hero" className={cn(landingHeroCard, landingHeroGlass)}>
            <HeroLiquidGlassBgLazy tone="blue" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <section className="flex min-h-0 flex-1 flex-col">
                <div
                  className={cn(
                    landingInner,
                    "flex min-h-0 flex-1 flex-col pb-8 pt-7 sm:pb-6 sm:pt-6 lg:pb-8 lg:pt-8"
                  )}
                >
                  <div className="shrink-0 text-center">
                    <h1 className={landingTitleHero}>
                      {t("titleBefore")}
                      <br className="sm:hidden" />{" "}
                      {t("titleAfter")}
                    </h1>

                    <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base lg:max-w-2xl lg:text-lg">
                      {t("subtitle")}
                    </p>
                  </div>

                  <div className="mt-auto w-full shrink-0 overflow-visible pt-6 pb-1 sm:pt-6 sm:pb-0">
                    <HeroComposeDemoLazy />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <main
            id={MAIN_CONTENT_ID}
            tabIndex={-1}
            className={cn(landingMainStack, landingHeroToMain, "outline-none")}
          >
            <LandingBelowFold />
          </main>

          <LandingFooterLazy />
        </div>
      </div>
    </LandingScrollProvider>
  )
}
