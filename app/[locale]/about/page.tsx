import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { TrackedContactLink } from "@/components/analytics/tracked-contact-link"
import { MarketingPageShell } from "@/components/landing/modern/marketing-page-shell"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"
import {
  landingCta,
  landingGlassSurface,
  landingHeroGlass,
  landingInner,
  landingTitleCard,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import {
  ABOUT_DESCRIPTION,
  APP_NEWS_PATH,
  ROOT_ROBOTS,
  SITE_NAME,
  SOCIAL_X_URL,
} from "@/lib/site"
import { SITE_URL } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESCRIPTION,
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/about",
    siteName: SITE_NAME,
    title: `About · ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `About · ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
  },
}

const SECTIONS = [
  { id: "what", headingKey: "whatHeading", bodyKey: "whatBody" },
  { id: "public", headingKey: "publicHeading", bodyKey: "publicBody", rich: true },
  { id: "helps", headingKey: "helpsHeading", bodyKey: "helpsBody" },
  { id: "private", headingKey: "privateHeading", bodyKey: "privateBody" },
  { id: "trust", headingKey: "trustHeading", bodyKey: "trustBody" },
] as const

async function AboutPage() {
  const t = await getTranslations("about")
  const common = await getTranslations("common")
  const footer = await getTranslations("modern.footer")
  const origin = SITE_URL
  const aboutPageLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    url: `${origin}/about`,
    description: ABOUT_DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: origin,
    },
  }

  return (
    <MarketingPageShell>
      <JsonLd id="json-ld-about" data={aboutPageLd} />

      <article
        className={cn(landingHeroGlass, "rounded-[2rem] sm:rounded-[2.5rem]")}
      >
        <div className={cn(landingInner, "py-10 sm:py-12 lg:py-14")}>
          <header className="mx-auto max-w-3xl text-center sm:text-start">
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {SITE_NAME}
            </p>
            <h1 className={cn(landingTitleSection, "mt-3")}>{t("title")}</h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("intro")}
            </p>
          </header>

          <Separator className="mx-auto my-10 max-w-3xl bg-foreground/8" />

          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                className={cn(
                  landingGlassSurface,
                  "rounded-[1.5rem] px-5 py-5 sm:px-6 sm:py-6"
                )}
                aria-labelledby={`about-${section.id}`}
              >
                <h2
                  id={`about-${section.id}`}
                  className={cn(landingTitleCard, "text-[1.125rem] sm:text-lg")}
                >
                  {t(section.headingKey)}
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
                  {"rich" in section && section.rich
                    ? t.rich(section.bodyKey, {
                        desk: (chunks) => (
                          <Link
                            href={APP_NEWS_PATH}
                            className="font-medium text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-colors hover:decoration-foreground/55"
                          >
                            {chunks}
                          </Link>
                        ),
                      })
                    : t(section.bodyKey)}
                </p>
              </section>
            ))}
          </div>

          <Separator className="mx-auto my-10 max-w-3xl bg-foreground/8" />

          <section
            className="mx-auto max-w-3xl text-center sm:text-start"
            aria-labelledby="about-hello"
          >
            <h2
              id="about-hello"
              className={cn(landingTitleCard, "text-[1.125rem] sm:text-lg")}
            >
              {t("helloHeading")}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              {t("helloBody")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
              <Button
                className={landingCta("primary", "sm")}
                render={
                  <TrackedContactLink
                    href={SOCIAL_X_URL}
                    channel="x"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                {t("xTwitter")}
              </Button>
              <Button
                className={landingCta("secondary", "sm")}
                nativeButton={false}
                render={<Link href={APP_NEWS_PATH} />}
              >
                {common("launchApp")}
              </Button>
              <Button
                className={landingCta("light", "sm")}
                nativeButton={false}
                render={<Link href="/privacy" />}
              >
                {footer("privacy")}
              </Button>
              <Button
                className={landingCta("light", "sm")}
                nativeButton={false}
                render={<Link href="/terms" />}
              >
                {footer("terms")}
              </Button>
              <Button
                className={landingCta("light", "sm")}
                nativeButton={false}
                render={<Link href="/refund" />}
              >
                {footer("refund")}
              </Button>
            </div>
          </section>
        </div>
      </article>
    </MarketingPageShell>
  )
}

export default AboutPage
