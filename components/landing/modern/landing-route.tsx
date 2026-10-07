import { getTranslations, setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { ModernLandingPage } from "@/components/landing/modern/landing-page"
import { JsonLd } from "@/components/seo/json-ld"
import { routing, type AppLocale } from "@/i18n/routing"
import { openGraphLocale } from "@/lib/i18n/locale"
import { SITE_URL } from "@/lib/seo"
import {
  APP_PATH,
  getSiteOrigin,
  LANDING_PATH,
  ROOT_ROBOTS,
  SITE_NAME,
  SOCIAL_X_URL,
} from "@/lib/site"

type Props = {
  params: Promise<{ locale: AppLocale }>
}

function landingCanonical(locale: AppLocale): string {
  return locale === routing.defaultLocale
    ? `${SITE_URL}${LANDING_PATH}`
    : `${SITE_URL}/${locale}${LANDING_PATH}`
}

export async function generateLandingMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  const title = t("homeTitle")
  const description = t("homeDescription")
  const og = t("homeOg")

  const canonical = landingCanonical(locale)

  const languages = Object.fromEntries(
    routing.locales.map((code) => [
      code,
      landingCanonical(code as AppLocale),
    ])
  ) as Record<string, string>
  languages["x-default"] = landingCanonical(routing.defaultLocale)

  return {
    title: { absolute: title },
    description,
    robots: ROOT_ROBOTS,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale(locale),
      url: canonical,
      siteName: SITE_NAME,
      title: og,
      description,
      images: [
        {
          url: "/opengraph-image?v=smart-assistant",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: og,
      description,
      images: ["/twitter-image?v=smart-assistant"],
    },
  }
}

export async function MarketingLandingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: "metadata" })
  const landingUrl = landingCanonical(locale)
  const chatOrigin = getSiteOrigin()
  const landingLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("homeTitle"),
    url: landingUrl,
    description: t("homeDescription"),
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    primaryEntity: {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: `${chatOrigin}${APP_PATH}`,
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
