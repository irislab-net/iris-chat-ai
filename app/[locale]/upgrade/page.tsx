import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { UpgradeView } from "@/components/billing/upgrade-view"
import { SITE_NAME } from "@/lib/seo"
import { UPGRADE_PATH, UPGRADE_ROBOTS } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("upgradePage")
  const title = t("heading")
  const description = t("subtitle")

  return {
    title,
    description,
    robots: UPGRADE_ROBOTS,
    alternates: {
      canonical: UPGRADE_PATH,
    },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: UPGRADE_PATH,
    },
  }
}

export default function UpgradePage() {
  return <UpgradeView />
}
