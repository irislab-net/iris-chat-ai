import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell/app-shell"
import { ProfileView } from "@/components/desk/profile-view"
import { SITE_NAME } from "@/lib/seo"
import { DESK_PROFILE_PATH } from "@/lib/site"

export const metadata: Metadata = {
  title: "Profile",
  description: "Wallet balance, deposits, withdrawals, and account.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: DESK_PROFILE_PATH,
  },
  openGraph: {
    title: `Profile · ${SITE_NAME}`,
    url: DESK_PROFILE_PATH,
  },
}

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileView />
    </AppShell>
  )
}
