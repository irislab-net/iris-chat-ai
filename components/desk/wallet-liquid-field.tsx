"use client"

import * as React from "react"

import { chatMobileGlassSurfaceClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const walletFieldShellClass = cn(
  chatMobileGlassSurfaceClass,
  "rounded-2xl border-white/55",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-8px_16px_-12px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-10px_rgba(15,23,42,0.14)]",
  "dark:border-white/5 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-10px_20px_-12px_rgba(0,0,0,0.45),0_8px_24px_-10px_rgba(0,0,0,0.42)]"
)

/** Nested Input — kill `Input`'s `dark:bg-input/30` so only the glass shell fills. */
const walletFieldInputClass =
  "relative z-10 h-12 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent disabled:bg-transparent dark:disabled:bg-transparent"

/** Nested Textarea — same glass fill; grows with content inside the shell. */
const walletFieldTextareaClass =
  "relative z-10 min-h-[2.75rem] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 shadow-none focus-visible:ring-0 dark:bg-transparent disabled:bg-transparent dark:disabled:bg-transparent"

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

export {
  WalletLiquidField,
  walletFieldInputClass,
  walletFieldTextareaClass,
  walletFieldShellClass,
}
