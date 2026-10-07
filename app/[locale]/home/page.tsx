import type { Metadata } from "next"

import {
  generateLandingMetadata,
  MarketingLandingPage,
} from "@/components/landing/modern/landing-route"
import { routing, type AppLocale } from "@/i18n/routing"

type Props = {
  params: Promise<{ locale: AppLocale }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/** ISR: marketing HTML can be cached at the edge (no per-request host headers). */
export const revalidate = 900

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateLandingMetadata(props)
}

/**
 * Landing page at `/home` (exur.ai/home locally and in production).
 */
export default async function HomeLandingPage(props: Props) {
  return <MarketingLandingPage {...props} />
}
