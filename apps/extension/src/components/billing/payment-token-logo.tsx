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
 * Official token marks shipped in `/public/billing`.
 * Full circular brand art, not bare glyphs on glass.
 */
export const PAYMENT_TOKEN_LOGOS = {
  USDT: "/billing/usdt.png",
  USDC: "/billing/usdc.png",
} as const satisfies Record<PaymentCurrency, string>

export const PAYMENT_NETWORK_LOGO =
  "https://assets.coingecko.com/coins/images/279/small/ethereum.png"

const discShell =
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full"

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
    <span className={cn(discShell, TOKEN_CLASS[size], className)} aria-hidden>
      {!failed ? (
        <Image
          src={PAYMENT_TOKEN_LOGOS[currency]}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full rounded-full object-cover"
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
        "p-px",
        NETWORK_CLASS[size],
        "ring-2 ring-white dark:ring-white",
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
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span className="text-[7px] font-bold text-muted-foreground">ETH</span>
      )}
    </span>
  )
}

/** Token brand mark for payment pickers. */
export function PaymentMethodMark({
  currency,
  size = "md",
  className,
}: {
  currency: PaymentCurrency
  size?: Size
  className?: string
}) {
  return (
    <PaymentTokenLogo currency={currency} size={size} className={className} />
  )
}
