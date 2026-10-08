"use client"

import { ChatGeminiCssLazy } from "@/components/app-shell/chat-gemini-css-lazy"
import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import { ExurLogo } from "@/components/brand/exur-logo"
import { AppKitRouteGate } from "@/components/layout/AppKitRouteGate"
import {
  NavbarWalletDesktop,
  NavbarWalletMobile,
} from "@/components/layout/NavbarWalletSection"
import { useAppKitReady } from "@/hooks/useAppKitReady"
import { Link } from "@/i18n/navigation"
import { AppKitReadyProvider } from "@/providers/AppKitReadyProvider"
import { BootstrapOrchestrationProvider } from "@/providers/BootstrapOrchestrationProvider"
import { TelegramEscalationProvider } from "@/providers/TelegramEscalationProvider"
import dynamic from "next/dynamic"
import { Suspense, type ReactNode } from "react"

const StakingApp = dynamic(
  () => import("@/components/pages/staking/StakingApp"),
  { ssr: false, loading: () => <StakingPageLoading /> }
)

function StakingPageLoading() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted-foreground"
      aria-busy
    >
      Loading staking…
    </div>
  )
}

function WalletReadyGate({ children }: { children: ReactNode }) {
  const ready = useAppKitReady()
  if (!ready) {
    return (
      <div
        className="h-9 w-24 animate-pulse rounded-full border border-white/55 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md"
        aria-hidden
      />
    )
  }
  return <>{children}</>
}

function StakingPageHeader() {
  return (
    <header className="relative z-40 shrink-0 pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Exur"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full active:scale-[0.96]"
        >
          <ExurLogo
            decorative
            variant="gradient"
            shimmer
            priority
            size={36}
            className="size-9 shrink-0 overflow-hidden rounded-full"
          />
        </Link>
        <WalletReadyGate>
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden md:flex">
              <NavbarWalletDesktop />
            </div>
            <div className="flex md:hidden">
              <NavbarWalletMobile />
            </div>
          </div>
        </WalletReadyGate>
      </div>
    </header>
  )
}

export function StakingPageClient() {
  return (
    <AppKitReadyProvider>
      <BootstrapOrchestrationProvider>
        <TelegramEscalationProvider>
          <ChatGeminiCssLazy />
          <div className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
            <ChatMobileGeminiBackground visible intro tone="blue" />
            <div className="relative z-10 flex min-h-svh flex-col">
              <StakingPageHeader />
              <main className="min-w-0 flex-1">
                <Suspense fallback={<StakingPageLoading />}>
                  <AppKitRouteGate>
                    <StakingApp />
                  </AppKitRouteGate>
                </Suspense>
              </main>
            </div>
          </div>
        </TelegramEscalationProvider>
      </BootstrapOrchestrationProvider>
    </AppKitReadyProvider>
  )
}
