import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { FeaturesOverview } from "@/components/landing/modern/features-overview"
import { MarketingPageShell } from "@/components/landing/modern/marketing-page-shell"
import { JsonLd } from "@/components/seo/json-ld"
import { FEATURES_PATH } from "@/lib/features-overview-data"
import { SITE_URL } from "@/lib/seo"
import { ROOT_ROBOTS, SITE_NAME } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("featuresPage")
  const title = t("metaTitle")
  const description = t("metaDescription")

  return {
    title,
    description,
    keywords: [
      "Exur features",
      "AI market desk",
      "trade setup card",
      "crypto payment",
      "AI co-pilot",
      SITE_NAME,
    ],
    robots: ROOT_ROBOTS,
    alternates: {
      canonical: FEATURES_PATH,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: FEATURES_PATH,
      siteName: SITE_NAME,
      title: `${title} · ${SITE_NAME}`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${title} · ${SITE_NAME}`,
      description,
    },
  }
}

async function FeaturesPage() {
  const t = await getTranslations("featuresPage")
  const origin = SITE_URL
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metaTitle"),
    url: `${origin}${FEATURES_PATH}`,
    description: t("metaDescription"),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: origin,
    },
  }

  return (
    <MarketingPageShell>
      <JsonLd id="json-ld-features" data={pageLd} />
      <FeaturesOverview />
    </MarketingPageShell>
  )
}

export default FeaturesPage
