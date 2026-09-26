"use client"

import * as React from "react"
import QRCode from "react-qr-code"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { PAYMENT_NETWORK } from "@/lib/billing/payment-options"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type DepositAddressCardProps = {
  address: string
  currency: PaymentCurrency
  /** Smaller QR + tighter rows for single-screen mobile sheets. */
  compact?: boolean
}

export function DepositAddressCard({
  address,
  currency,
  compact = false,
}: DepositAddressCardProps) {
  const t = useTranslations("upgradePage.crypto")
  const [copied, setCopied] = React.useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2_000)
    } catch {
      setCopied(false)
    }
  }

  const qrSize = compact ? 176 : 188

  return (
    <div className={cn("flex flex-col items-center", compact ? "gap-3.5" : "gap-4")}>
      <div className="bg-white p-3 dark:bg-white">
        <QRCode
          value={address}
          size={qrSize}
          level="M"
          bgColor="#ffffff"
          fgColor="#0a0a0a"
        />
      </div>

      <div className="flex w-full min-w-0 items-center gap-2.5">
        <code className="min-w-0 flex-1 truncate text-start font-mono text-xs leading-snug text-foreground/90">
          {address}
        </code>
        <Button
          type="button"
          size="icon-sm"
          className={cn(landingCta("secondary", "sm"), "size-8 shrink-0 px-0")}
          onClick={() => void onCopy()}
          aria-label={copied ? t("addressCopied") : t("copyAddress")}
        >
          {copied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </Button>
      </div>

      <p className="text-center text-[11px] leading-snug text-muted-foreground">
        {t("networkOnly", {
          currency,
          network: PAYMENT_NETWORK.name,
        })}
      </p>
    </div>
  )
}
