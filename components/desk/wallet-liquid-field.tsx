"use client"

import * as React from "react"

import { chatMobileGlassSurfaceClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const walletFieldShellClass = cn(
  chatMobileGlassSurfaceClass,
  "rounded-2xl border-white/55",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-8px_16px_-12px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-10px_rgba(15,23,42,0.14)]",
  "dark:border-white/20 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.14),inset_0_-10px_20px_-12px_rgba(0,0,0,0.45),0_8px_24px_-10px_rgba(0,0,0,0.42)]"
)

function WalletLiquidField({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(walletFieldShellClass, className)}>
      <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
      {children}
    </div>
  )
}

export { WalletLiquidField, walletFieldShellClass }
