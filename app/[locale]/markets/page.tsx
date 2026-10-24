import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell/app-shell"
import { MarketsView } from "@/components/desk/markets-view"
import { SITE_NAME } from "@/lib/seo"
import { DESK_MARKETS_PATH } from "@/lib/site"

export const metadata: Metadata = {
  title: "Markets",
  description: "Live market prices for BTC, ETH, and gold.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: DESK_MARKETS_PATH,
  },
  openGraph: {
    title: `Markets · ${SITE_NAME}`,
    url: DESK_MARKETS_PATH,
  },
}

export default function MarketsPage() {
  return (
    <AppShell>
      <MarketsView />
    </AppShell>
  )
}
