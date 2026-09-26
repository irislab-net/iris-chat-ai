import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import dynamic from "next/dynamic"
import { Suspense } from "react"

import { fetchPublicHomeSnapshot } from "@/lib/api/public-home"
import { DashboardSkeleton } from "@/components/dashboard/intel-skeletons"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/seo"
import { isMarketingRequest } from "@/lib/request-host"
import {
  APP_PATH,
  getLandingHref,
  PRODUCTION_ORIGIN,
  ROOT_ROBOTS,
} from "@/lib/site"
import { resolveWorkspaceTab } from "@/lib/workspace-tab"
import type { AppLocale } from "@/i18n/routing"

const AppShell = dynamic(
  () => import("@/components/app-shell/app-shell").then((m) => m.AppShell),
  {
    loading: () => (
      <div className="flex h-app overflow-hidden bg-background">
        <DashboardSkeleton />
      </div>
    ),
  }
)

const HomeView = dynamic(
  () => import("@/components/dashboard/home-view").then((m) => m.HomeView),
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
  // Public desk entry on chat.exur.ai — indexable; marketing acquisition stays on exur.ai.
  robots: ROOT_ROBOTS,
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
    const { generateLandingMetadata } =
      await import("@/components/landing/modern/landing-route")
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

/**
 * Chat desk at `/` (chat.exur.ai / local).
 * Marketing apex: proxy rewrites `/` → `/home`; this host check is a safety net
 * if the rewrite is skipped (e.g. preview hosts still hit this page).
 * Landing is dynamically imported so gsap/landing never enter the chat graph.
 */
export default async function RootPage({ params, searchParams }: PageProps) {
  if (await isMarketingRequest()) {
    const { MarketingLandingPage } =
      await import("@/components/landing/modern/landing-route")
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
