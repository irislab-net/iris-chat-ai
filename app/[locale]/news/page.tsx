import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell/app-shell"
import { HomeViewLazy } from "@/components/dashboard/home-view-lazy"
import { SITE_NAME } from "@/lib/seo"
import { DESK_NEWS_PATH } from "@/lib/site"

export const metadata: Metadata = {
  title: "News",
  description: "Market news and impact context for BTC, ETH, and gold.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: DESK_NEWS_PATH,
  },
  openGraph: {
    title: `News · ${SITE_NAME}`,
    url: DESK_NEWS_PATH,
  },
}

export default function NewsPage() {
  return (
    <AppShell>
      <HomeViewLazy />
    </AppShell>
  )
}
