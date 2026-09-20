import type { Metadata } from "next"

import { BillingView } from "@/components/billing/billing-view"
import { SITE_NAME } from "@/lib/seo"
import { BILLING_PATH, BILLING_ROBOTS } from "@/lib/site"

export const metadata: Metadata = {
  title: "Billing",
  description: "Billing status, invoice history, and payment history.",
  robots: BILLING_ROBOTS,
  alternates: {
    canonical: BILLING_PATH,
  },
  openGraph: {
    title: `Billing · ${SITE_NAME}`,
    url: BILLING_PATH,
  },
}

export default function BillingPage() {
  return <BillingView />
}
