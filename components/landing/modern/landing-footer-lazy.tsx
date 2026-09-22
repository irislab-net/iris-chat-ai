"use client"

import dynamic from "next/dynamic"

const ModernFooter = dynamic(
  () =>
    import("@/components/landing/modern/modern-footer").then(
      (m) => m.ModernFooter
    ),
  { ssr: true }
)

export function LandingFooterLazy() {
  return <ModernFooter />
}
