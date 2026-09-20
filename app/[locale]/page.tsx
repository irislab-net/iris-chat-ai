import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { Suspense } from "react"

import { fetchPublicHomeSnapshot } from "@/lib/api/public-home"
import { AppShell } from "@/components/app-shell/app-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard"
import { HomeView } from "@/components/dashboard/home-view"
import { PublicHomeIntro } from "@/components/dashboard/public-home-intro"
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/seo"
import { APP_PATH, LANDING_PATH, ROOT_ROBOTS } from "@/lib/site"
import { resolveWorkspaceTab } from "@/lib/workspace-tab"

export const metadata: Metadata = {
  title: {
    absolute: `News · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: APP_PATH,
  },
  openGraph: {
    title: `${SITE_TITLE} · News`,
    description: SITE_DESCRIPTION,
    url: APP_PATH,
    type: "website",
  },
}

/** Matches `PUBLIC_HOME_REVALIDATE_SECONDS` (literal required for the segment config). */
export const revalidate = 900

async function NewsWithSnapshot({
  initialTab,
}: {
  initialTab: ReturnType<typeof resolveWorkspaceTab>
}) {
  const snapshot = await fetchPublicHomeSnapshot()
  return (
    <HomeView
      intro={<PublicHomeIntro />}
      initialInsight={snapshot.insight}
      initialNews={snapshot.news}
      initialTab={initialTab}
    />
  )
}

export default async function AppNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const params = await searchParams
  const tabValue = Array.isArray(params.tab) ? params.tab[0] : params.tab
  const initialTab = resolveWorkspaceTab(tabValue)
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
              <Link href={LANDING_PATH}>Exur landing</Link>
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
              <a href="https://x.com/exur_ai">Exur on X</a>
            </li>
          </ul>
        </nav>
      </header>
      <AppShell>
        <Suspense
          fallback={
            <div className="flex h-full min-h-0 w-full flex-1 flex-col">
              <DashboardSkeleton variant="intel" />
            </div>
          }
        >
          <NewsWithSnapshot initialTab={initialTab} />
        </Suspense>
      </AppShell>
    </>
  )
}
