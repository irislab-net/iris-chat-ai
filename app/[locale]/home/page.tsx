import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import { ModernLandingPage } from "@/components/landing/modern/landing-page"
import { JsonLd } from "@/components/seo/json-ld"
import { openGraphLocale } from "@/lib/i18n/locale"
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/seo"
import { APP_PATH, getSiteOrigin, LANDING_PATH, ROOT_ROBOTS, SITE_NAME, SOCIAL_X_URL } from "@/lib/site"
import type { AppLocale } from "@/i18n/routing"

type Props = {
  params: Promise<{ locale: AppLocale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const title = "Exur: AI Financial Assistant"
  const description =
    "See where your money is going. Ask in plain language. Get a clear next step."

  const canonical =
    locale === "en" ? `${SITE_URL}/home` : `${SITE_URL}/ar/home`

  return {
    title: { absolute: title },
    description,
    robots: ROOT_ROBOTS,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/home`,
        ar: `${SITE_URL}/ar/home`,
        "x-default": `${SITE_URL}/home`,
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale(locale),
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const origin = getSiteOrigin()
  const landingUrl = `${origin}${LANDING_PATH}`
  const landingLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Exur: AI Financial Assistant",
    url: landingUrl,
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
      url: `${origin}${APP_PATH}`,
      sameAs: [SOCIAL_X_URL],
    },
  }

  return (
    <>
      <JsonLd id="json-ld-landing" data={landingLd} />
      <ModernLandingPage />
    </>
  )
}
