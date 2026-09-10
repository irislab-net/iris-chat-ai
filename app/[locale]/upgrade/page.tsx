import type { Metadata } from "next"

import { UpgradeView } from "@/components/billing/upgrade-view"
import { SITE_NAME } from "@/lib/seo"
import { UPGRADE_PATH, UPGRADE_ROBOTS } from "@/lib/site"

export const metadata: Metadata = {
  title: "Choose a plan",
  description: "Pick Free, Plus, or Ultimate and pay with USDT.",
  robots: UPGRADE_ROBOTS,
  alternates: {
    canonical: UPGRADE_PATH,
  },
  openGraph: {
    title: `Choose a plan · ${SITE_NAME}`,
    url: UPGRADE_PATH,
  },
}

export default function UpgradePage() {
  return <UpgradeView />
}
