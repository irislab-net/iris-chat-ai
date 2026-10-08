"use client"

import dynamic from "next/dynamic"

const StakingPageClient = dynamic(
  () =>
    import("@/components/staking/staking-page-client").then((m) => ({
      default: m.StakingPageClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-svh items-center justify-center px-4 text-sm text-muted-foreground"
        aria-busy
      >
        Loading staking…
      </div>
    ),
  }
)

/** Client-only gate so Reown/AppKit never enters the RSC/SSR module graph. */
export function StakingPageLoader() {
  return <StakingPageClient />
}
