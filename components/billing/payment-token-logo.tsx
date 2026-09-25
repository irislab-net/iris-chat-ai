"use client"

import * as React from "react"
import Image from "next/image"

import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"
type NetworkSize = "xs" | "sm" | "md"

const TOKEN_CLASS: Record<Size, string> = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
}

const TOKEN_PX: Record<Size, number> = {
  sm: 24,
  md: 32,
  lg: 40,
}

const NETWORK_CLASS: Record<NetworkSize, string> = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
}

const NETWORK_PX: Record<NetworkSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
}

/**
 * Official coin marks (CoinGecko CDN — same source as market tape logos).
 * Full circular brand art, not bare glyphs on glass.
 */
export const PAYMENT_TOKEN_LOGOS = {
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
} as const satisfies Record<PaymentCurrency, string>

export const PAYMENT_NETWORK_LOGO =
  "https://assets.coingecko.com/coins/images/279/small/ethereum.png"

const discShell =
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full " +
  "bg-white p-[12%] " +
  "shadow-[0_0_0_1px_color-mix(in_oklch,var(--foreground)_8%,transparent)] " +
  "dark:bg-white dark:shadow-[0_0_0_1px_color-mix(in_oklch,var(--foreground)_12%,transparent)]"

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
  const px = TOKEN_PX[size]
  const [failed, setFailed] = React.useState(false)

  return (
    <span
      className={cn(discShell, TOKEN_CLASS[size], className)}
      aria-hidden
    >
      {!failed ? (
        <Image
          src={PAYMENT_TOKEN_LOGOS[currency]}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full rounded-full object-contain"
        />
      ) : (
        <span className="font-mono text-[9px] font-bold text-muted-foreground">
          {currency.slice(0, 2)}
        </span>
      )}
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
  const px = NETWORK_PX[size]
  const [failed, setFailed] = React.useState(false)

  return (
    <span
      className={cn(
        discShell,
        NETWORK_CLASS[size],
        "ring-2 ring-background dark:ring-background",
        className
      )}
      aria-hidden
    >
      {!failed ? (
        <Image
          src={PAYMENT_NETWORK_LOGO}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full rounded-full object-contain"
        />
      ) : (
        <span className="text-[7px] font-bold text-muted-foreground">ETH</span>
      )}
    </span>
  )
}

/** Token + network as an overlapping pair of real brand marks. */
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
