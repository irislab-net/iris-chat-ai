"use client"

import * as React from "react"
import QRCode from "react-qr-code"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { PAYMENT_NETWORK } from "@/lib/billing/payment-options"

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
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="flex justify-center border-b border-border/50 bg-muted/15 px-4 py-5">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <QRCode
            value={address}
            size={152}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>
      </div>

      <div className="space-y-2.5 p-3.5">
        <div className="flex items-center gap-2 rounded-xl bg-muted/30 py-1.5 ps-3 pe-1.5">
          <code className="min-w-0 flex-1 truncate text-start font-mono text-[11px] leading-none text-foreground/90">
            {address}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0 rounded-lg"
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
    </div>
  )
}
