"use client"

import * as React from "react"
import QRCode from "react-qr-code"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { BillingGlassPanel } from "@/components/billing/billing-glass"
import { Button } from "@/components/ui/button"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { PAYMENT_NETWORK } from "@/lib/billing/payment-options"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type DepositAddressCardProps = {
  address: string
  currency: PaymentCurrency
}

export function DepositAddressCard({ address, currency }: DepositAddressCardProps) {
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

  return (
    <BillingGlassPanel>
      <div className="flex justify-center border-b border-white/55 px-4 py-5 dark:border-white/10">
        <div className="rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <QRCode
            value={address}
            size={152}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>
      </div>

      <div className="space-y-2.5 p-3.5 sm:p-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/45 py-1.5 ps-3 pe-1.5 dark:bg-white/10">
          <code className="min-w-0 flex-1 truncate text-start font-mono text-[11px] leading-none text-foreground/90">
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

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t("networkOnly", {
            currency,
            network: PAYMENT_NETWORK.name,
          })}
        </p>
      </div>
    </BillingGlassPanel>
  )
}
