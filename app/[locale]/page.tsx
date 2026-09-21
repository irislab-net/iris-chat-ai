import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import dynamic from "next/dynamic"
import { Suspense } from "react"

import {
  generateLandingMetadata,
  MarketingLandingPage,
} from "@/components/landing/modern/landing-route"
import { fetchPublicHomeSnapshot } from "@/lib/api/public-home"
import { AppShell } from "@/components/app-shell/app-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard"
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/seo"
import { isMarketingRequest } from "@/lib/request-host"
import {
  APP_PATH,
  AUTH_SUCCESS_ROBOTS,
  getLandingHref,
  PRODUCTION_ORIGIN,
} from "@/lib/site"
import { resolveWorkspaceTab } from "@/lib/workspace-tab"
import type { AppLocale } from "@/i18n/routing"

const HomeView = dynamic(
  () =>
    import("@/components/dashboard/home-view").then((m) => m.HomeView),
  {
    loading: () => (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col">
        <DashboardSkeleton />
      </div>
    ),
  }
)

const newsMetadata: Metadata = {
  title: {
    absolute: `News · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // Desk lives on chat.exur.ai; marketing acquisition is exur.ai.
  robots: AUTH_SUCCESS_ROBOTS,
  alternates: {
    canonical: PRODUCTION_ORIGIN,
  },
  openGraph: {
    title: `${SITE_TITLE} · News`,
    description: SITE_DESCRIPTION,
    url: PRODUCTION_ORIGIN,
    type: "website",
  },
}

/** Matches `PUBLIC_HOME_REVALIDATE_SECONDS` (literal required for the segment config). */
export const revalidate = 900

type PageProps = {
  params: Promise<{ locale: AppLocale }>
  searchParams: Promise<{ tab?: string | string[] }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (await isMarketingRequest()) {
    return generateLandingMetadata({ params })
  }
  return newsMetadata
}

async function NewsWithSnapshot({
  initialTab,
}: {
  initialTab: ReturnType<typeof resolveWorkspaceTab>
}) {
  const snapshot = await fetchPublicHomeSnapshot()
  return (
    <HomeView
      initialInsight={snapshot.insight}
      initialNews={snapshot.news}
      initialTab={initialTab}
    />
  )
}

export default async function RootPage({ params, searchParams }: PageProps) {
  if (await isMarketingRequest()) {
    return <MarketingLandingPage params={params} />
  }

  const query = await searchParams
  const tabValue = Array.isArray(query.tab) ? query.tab[0] : query.tab
  const initialTab = resolveWorkspaceTab(tabValue)
  const landingHref = getLandingHref()

  return (
    <>
      <header className="sr-only">
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
        <Suspense
          fallback={
            <div className="flex h-full min-h-0 w-full flex-1 flex-col">
              <DashboardSkeleton />
            </div>
          }
        >
          <NewsWithSnapshot initialTab={initialTab} />
        </Suspense>
      </AppShell>
    </>
  )
}
