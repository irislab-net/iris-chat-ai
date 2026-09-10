"use client"

import * as React from "react"

import type { PaymentInvoice } from "@/lib/billing/invoice-types"
import { findLatestResumableInvoice } from "@/lib/billing/invoice-session"
import { listPaymentInvoices } from "@/lib/billing/invoices"

const DEFAULT_POLL_MS = 5_000

type UsePendingPaymentInvoiceOptions = {
  enabled: boolean
  onPaid?: () => void | Promise<void>
  pollMs?: number
}

export function usePendingPaymentInvoice({
  enabled,
  onPaid,
  pollMs = DEFAULT_POLL_MS,
}: UsePendingPaymentInvoiceOptions) {
  const [pendingInvoice, setPendingInvoice] =
    React.useState<PaymentInvoice | null>(null)
  const onPaidRef = React.useRef(onPaid)

  React.useEffect(() => {
    onPaidRef.current = onPaid
  }, [onPaid])

  React.useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let trackedUid: string | null = null

    const sync = async () => {
      try {
        const invoices = await listPaymentInvoices()
        if (cancelled) return

        const pending = findLatestResumableInvoice(invoices)
        setPendingInvoice(pending)
        if (pending) trackedUid = pending.uid

        const tracked = trackedUid
          ? invoices.find((invoice) => invoice.uid === trackedUid)
          : null
        if (tracked?.status === "paid") {
          await onPaidRef.current?.()
        }
      } catch {
        // keep polling through transient failures
      }
    }

    void sync()
    const interval = window.setInterval(() => void sync(), pollMs)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [enabled, pollMs])

  return enabled ? pendingInvoice : null
}
