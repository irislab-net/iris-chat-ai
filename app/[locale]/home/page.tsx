import type { Metadata } from "next"
import { redirect } from "next/navigation"

import {
  generateLandingMetadata,
  MarketingLandingPage,
} from "@/components/landing/modern/landing-route"
import { isMarketingRequest } from "@/lib/request-host"
import type { AppLocale } from "@/i18n/routing"

type Props = {
  params: Promise<{ locale: AppLocale }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateLandingMetadata(props)
}

/** Local / preview landing. Production apex serves the same UI at `/`. */
export default async function LegacyHomeLandingPage(props: Props) {
  if (await isMarketingRequest()) {
    const { locale } = await props.params
    redirect(locale === "en" ? "/" : `/${locale}`)
  }
  return <MarketingLandingPage {...props} />
}
