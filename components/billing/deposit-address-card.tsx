"use client"

import * as React from "react"
import QRCode from "react-qr-code"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { PAYMENT_NETWORK } from "@/lib/billing/payment-options"

type DepositAddressCardProps = {
  address: string
  currency: PaymentCurrency
}

export function DepositAddressCard({ address, currency }: DepositAddressCardProps) {
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

      <div className="space-y-3 p-4">
        <div className="rounded-xl bg-muted/30 px-3 py-2.5">
          <code className="block break-all text-left font-mono text-[11px] leading-relaxed text-foreground/90">
            {address}
          </code>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl"
          onClick={() => void onCopy()}
        >
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copied ? "Address copied" : "Copy wallet address"}
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Use {currency} on {PAYMENT_NETWORK.name} only.
        </p>
      </div>
    </div>
  )
}
