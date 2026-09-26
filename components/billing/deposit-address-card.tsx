"use client"

import * as React from "react"
import QRCode from "react-qr-code"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import {
  landingCta,
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type DepositAddressCardProps = {
  address: string
  currency: PaymentCurrency
  /** Smaller QR + tighter rows for single-screen mobile sheets. */
  compact?: boolean
}

export function DepositAddressCard({
  address,
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
  // Match QR glass frame, then shave a bit so the address reads slightly narrower.
  const addressWidth = qrSize + 20 + 24 - 12

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        compact ? "gap-2.5" : "gap-3"
      )}
    >
      <div
        className={cn(
          landingGlassSurface,
          "rounded-[1.25rem] bg-white/55 p-2.5 dark:bg-white/10"
        )}
      >
        <span
          aria-hidden
          className={cn(landingGlassSheen, "rounded-[1.25rem]")}
        />
        <div className="relative z-10 overflow-hidden rounded-xl bg-white p-3">
          <QRCode
            value={address}
            size={qrSize}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>
      </div>

      <div
        className="flex min-w-0 items-center gap-2"
        style={{ width: addressWidth }}
      >
        <code className="min-w-0 flex-1 break-all text-start font-mono text-xs leading-relaxed tracking-wide text-foreground/90 sm:text-sm">
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
    </div>
  )
}
