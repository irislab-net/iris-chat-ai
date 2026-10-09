import type { Metadata } from "next"

import { StakingPageLoader } from "@/components/staking/staking-page-loader"
import { SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Staking · ${SITE_NAME}`,
  description: "Stake supported assets, track balances, and manage withdrawals.",
  robots: { index: false, follow: false },
}

export default function StakingPage() {
  return <StakingPageLoader />
}
