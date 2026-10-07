import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { HomeViewLazy } from "@/components/dashboard/home-view-lazy"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/seo"
import { isMarketingRequest } from "@/lib/request-host"
import {
  APP_PATH,
  getLandingHref,
  PRODUCTION_ORIGIN,
  ROOT_ROBOTS,
} from "@/lib/site"
import type { AppLocale } from "@/i18n/routing"

const newsMetadata: Metadata = {
  title: {
    absolute: `News · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // Public desk entry on chat.exur.ai — indexable; marketing acquisition stays on exur.ai.
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: PRODUCTION_ORIGIN,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: PRODUCTION_ORIGIN,
    type: "website",
    images: [
      {
        url: "/opengraph-image?v=smart-assistant",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image?v=smart-assistant"],
  },
}

type PageProps = {
  params: Promise<{ locale: AppLocale }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (await isMarketingRequest()) {
    const { generateLandingMetadata } =
      await import("@/components/landing/modern/landing-route")
    return generateLandingMetadata({ params })
  }
  return newsMetadata
}

/**
 * Chat desk at `/` (chat.exur.ai / local).
 * Marketing apex: proxy rewrites `/` → `/home`; this host check is a safety net
 * if the rewrite is skipped (e.g. preview hosts still hit this page).
 * Landing is dynamically imported so gsap/landing never enter the chat graph.
 * AppShell is a static import so the empty-hero LCP stub is in the first RSC
 * payload (no DashboardSkeleton waterfall). News mounts after idle.
 */
export default async function RootPage({ params }: PageProps) {
  if (await isMarketingRequest()) {
    const { MarketingLandingPage } =
      await import("@/components/landing/modern/landing-route")
    return <MarketingLandingPage params={params} />
  }

  const landingHref = getLandingHref()

  return (
    <>
      <header className="sr-only">
        <h1>{SITE_TITLE}</h1>
        <p>{SITE_DESCRIPTION}</p>
        <nav aria-label="Primary">
          <ul>
            <li>
              <Link href={APP_PATH}>Market news</Link>
            </li>
            <li>
              <a href={landingHref}>Exur landing</a>
            </li>
            <li>
              <Link href="/what-is-exur">What is Exur?</Link>
            </li>
            <li>
              <Link href="/about">About Exur</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/refund">Refund Policy</Link>
            </li>
            <li>
              <a href="https://x.com/exur_ai">Exur on X</a>
            </li>
          </ul>
        </nav>
      </header>
      <AppShell>
        <HomeViewLazy />
      </AppShell>
    </>
  )
}
