"use client"

import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"
type NetworkSize = "xs" | "sm" | "md"

const TOKEN_CLASS: Record<Size, string> = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
}

const NETWORK_CLASS: Record<NetworkSize, string> = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
}

/** Solid-enough disc so brand glyphs read as badges, not bare icons. */
const glassDisc =
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full " +
  "shadow-[inset_0_0.5px_0_0_color-mix(in_oklch,white_70%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent)] " +
  "backdrop-blur-[8px] backdrop-saturate-150 " +
  "bg-white/88 supports-[backdrop-filter]:bg-white/72 " +
  "dark:bg-white/[0.14] dark:shadow-[inset_0_0.5px_0_0_color-mix(in_oklch,white_12%,transparent),0_1px_2px_rgba(0,0,0,0.35)] " +
  "dark:supports-[backdrop-filter]:bg-white/[0.1]"

const TINT = {
  USDT: "bg-[#26A17B]/20 dark:bg-[#26A17B]/28",
  USDC: "bg-[#2775CA]/20 dark:bg-[#2775CA]/28",
  ETH: "bg-[#627EEA]/22 dark:bg-[#627EEA]/30",
} as const

/** Tether T — brand green glyph on glass. */
function UsdtGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        fill="#26A17B"
        d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.889-.171-6.79-.848-6.79-1.658 0-.809 2.901-1.486 6.79-1.66v2.644c.253.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
      />
    </svg>
  )
}

/** USDC dollar — brand blue glyph on glass. */
function UsdcGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        fill="#2775CA"
        d="M20.155 18.43c0-2.14-1.304-2.866-3.92-3.196-1.864-.294-2.22-.608-2.22-1.316 0-.63.52-1.106 1.61-1.106.982 0 1.476.36 1.69 1.074a.42.42 0 0 0 .404.292h.906c.338 0 .556-.298.49-.626-.28-1.316-1.274-2.1-2.72-2.392V9.82a.55.55 0 0 0-.55-.55h-.64a.55.55 0 0 0-.55.55v1.3c-1.61.28-2.66 1.35-2.66 2.82 0 1.92 1.14 2.69 3.64 3.08 1.82.29 2.5.58 2.5 1.42 0 .78-.62 1.28-1.8 1.28-1.22 0-1.82-.42-2.02-1.28a.45.45 0 0 0-.436-.34h-.92c-.35 0-.58.31-.5.65.34 1.42 1.3 2.24 2.9 2.54v1.34c0 .304.246.55.55.55h.64a.55.55 0 0 0 .55-.55v-1.35c1.66-.28 2.84-1.37 2.84-3.02"
      />
    </svg>
  )
}

/** Ethereum diamond — brand indigo on glass. */
function EthGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path fill="#627EEA" fillOpacity=".75" d="M16.498 5.2v8.2l6.9 3.08z" />
      <path fill="#627EEA" d="M16.498 5.2 9.6 16.48l6.898-3.08z" />
      <path fill="#627EEA" fillOpacity=".75" d="M16.498 21.2v5.55l6.9-9.55z" />
      <path fill="#627EEA" d="M16.498 26.75V21.2l-6.898-4z" />
      <path fill="#627EEA" fillOpacity=".45" d="m16.498 19.95 6.9-4-6.9-3.08z" />
      <path fill="#627EEA" fillOpacity=".65" d="m9.6 15.95 6.898 4v-7.08z" />
    </svg>
  )
}

type PaymentTokenLogoProps = {
  currency: PaymentCurrency
  size?: Size
  className?: string
}

export function PaymentTokenLogo({
  currency,
  size = "md",
  className,
}: PaymentTokenLogoProps) {
  const Glyph = currency === "USDC" ? UsdcGlyph : UsdtGlyph
  const glyphPad = size === "lg" ? "size-[70%]" : "size-[72%]"

  return (
    <span
      className={cn(glassDisc, TOKEN_CLASS[size], className)}
      aria-hidden
    >
      <span className={cn("absolute inset-0 rounded-full", TINT[currency])} />
      <Glyph className={cn("relative", glyphPad)} />
    </span>
  )
}

type PaymentNetworkLogoProps = {
  size?: NetworkSize
  className?: string
}

export function PaymentNetworkLogo({
  size = "sm",
  className,
}: PaymentNetworkLogoProps) {
  return (
    <span
      className={cn(glassDisc, NETWORK_CLASS[size], className)}
      aria-hidden
    >
      <span className={cn("absolute inset-0 rounded-full", TINT.ETH)} />
      <EthGlyph className="relative size-[78%]" />
    </span>
  )
}

/** Token + network as an overlapping liquid-glass pair. */
export function PaymentMethodMark({
  currency,
  size = "md",
  className,
}: {
  currency: PaymentCurrency
  size?: Size
  className?: string
}) {
  const networkSize: NetworkSize =
    size === "lg" ? "md" : size === "md" ? "sm" : "xs"

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)} aria-hidden>
      <PaymentTokenLogo currency={currency} size={size} />
      <PaymentNetworkLogo size={networkSize} className="-ms-2" />
    </span>
  )
}
