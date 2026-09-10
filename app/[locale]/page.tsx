import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { LandingComingSoon } from "@/components/landing/coming-soon"
import { LandingCopilot } from "@/components/landing/copilot"
import { LandingDemoTrading } from "@/components/landing/demo-trading"
import { LandingMarketWatch } from "@/components/landing/market-watch"
import { LandingFaq } from "@/components/landing/faq"
import { LandingFeatures } from "@/components/landing/features"
import { LandingHero } from "@/components/landing/hero"
import { LandingNav } from "@/components/landing/nav"
import { LandingPricing } from "@/components/landing/pricing"
import { LandingTestimonials } from "@/components/landing/testimonial-lazy"
import { SiteFooter } from "@/components/landing/site-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { openGraphLocale } from "@/lib/i18n/locale"
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/seo"
import { getSiteOrigin, ROOT_ROBOTS, SITE_NAME, SOCIAL_X_URL } from "@/lib/site"
import type { AppLocale } from "@/i18n/routing"

type Props = {
  params: Promise<{ locale: AppLocale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  return {
    title: { absolute: t("homeTitle") },
    description: t("homeDescription"),
    robots: ROOT_ROBOTS,
    alternates: {
      canonical: locale === "en" ? SITE_URL : `${SITE_URL}/ar`,
      languages: {
        en: SITE_URL,
        ar: `${SITE_URL}/ar`,
        "x-default": SITE_URL,
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale(locale),
      url: locale === "en" ? SITE_URL : `${SITE_URL}/ar`,
      siteName: SITE_NAME,
      title: t("homeTitle"),
      description: t("homeOg"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("homeTitle"),
      description: t("homeOg"),
    },
  }
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const origin = getSiteOrigin()
  const landingLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SITE_NAME,
    url: origin,
    description: SITE_DESCRIPTION,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: origin,
    },
    primaryEntity: {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: `${origin}/app`,
      sameAs: [SOCIAL_X_URL],
    },
  }

  return (
    <div className="relative w-full overflow-x-hidden bg-background selection:bg-foreground/15">
      <JsonLd data={landingLd} />
      <LandingNav />

      <main className="relative z-10 w-full rounded-b-3xl border-b border-border/40 bg-background">
        <LandingHero />
        <LandingFeatures />
        <LandingCopilot />
        <LandingDemoTrading />
        <LandingMarketWatch />
        <LandingComingSoon />
        <LandingPricing />
        <LandingTestimonials />
        <LandingFaq />
      </main>

      <SiteFooter />
    </div>
  )
}
