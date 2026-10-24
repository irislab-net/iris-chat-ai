import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell/app-shell"
import { TradeView } from "@/components/desk/trade-view"
import { SITE_NAME } from "@/lib/seo"
import { DESK_TRADE_PATH } from "@/lib/site"

export const metadata: Metadata = {
  title: "Trade",
  description: "Auto-managed positions opened for your account.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: DESK_TRADE_PATH,
  },
  openGraph: {
    title: `Trade · ${SITE_NAME}`,
    url: DESK_TRADE_PATH,
  },
}

export default function TradePage() {
  return (
    <AppShell>
      <TradeView />
    </AppShell>
  )
}
