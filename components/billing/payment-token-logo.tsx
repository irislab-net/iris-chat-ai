"use client"

import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { cn } from "@/lib/utils"

type PaymentTokenLogoProps = {
  currency: PaymentCurrency
  size?: "sm" | "md"
  className?: string
}

function UsdtGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#fff"
        d="M17.6 17.7v2.1c-.5.1-1 .15-1.6.15-.6 0-1.1-.05-1.6-.15v-2.1H9.2v-2.3h4.8v-2c-3.3-.7-5.7-2.4-5.7-4.6 0-2.7 3.5-4.8 8.2-4.8s8.2 2.1 8.2 4.8c0 2.2-2.4 3.9-5.7 4.6v2h4.8v2.3h-5.4zm-6.4-7.2c0 1.3 2.3 2.3 5.2 2.3s5.2-1 5.2-2.3-2.3-2.3-5.2-2.3-5.2 1-5.2 2.3z"
      />
    </svg>
  )
}

function UsdcGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path
        fill="#fff"
        d="M20.1 18.6c0-2.5-1.5-3.4-4.5-3.8-2.1-.3-2.5-.7-2.5-1.6 0-.8.7-1.4 2-1.4 1.2 0 1.9.4 2.2 1.3.1.2.3.4.6.4h1c.4 0 .7-.3.7-.7-.1-1.4-1.1-2.5-2.8-2.9v-1.7c0-.4-.3-.7-.7-.7h-.9c-.4 0-.7.3-.7.7v1.6c-1.8.3-3 1.5-3 3.1 0 2.3 1.4 3.2 4.3 3.6 2 .3 2.7.8 2.7 1.7 0 1-.8 1.5-2.3 1.5-1.6 0-2.3-.6-2.5-1.5-.1-.3-.3-.5-.6-.5h-1.1c-.4 0-.7.3-.7.7.2 1.5 1.3 2.5 3.1 2.9v1.7c0 .4.3.7.7.7h.9c.4 0 .7-.3.7-.7v-1.7c1.8-.4 3.1-1.6 3.1-3.3z"
      />
    </svg>
  )
}

const SIZE_CLASS = {
  sm: "size-6",
  md: "size-8",
} as const

export function PaymentTokenLogo({
  currency,
  size = "md",
  className,
}: PaymentTokenLogoProps) {
  const Glyph = currency === "USDC" ? UsdcGlyph : UsdtGlyph

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        SIZE_CLASS[size],
        className
      )}
      aria-hidden
    >
      <Glyph className="size-full" />
    </span>
  )
}
