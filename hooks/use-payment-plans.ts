"use client"

import * as React from "react"

import type { BillingCycle } from "@/lib/billing/catalog"
import {
  fetchPaymentPlans,
  formatPlanPriceUsd,
  plusPriceUsdFromPlans,
  type PaymentPlan,
} from "@/lib/billing/plans"

type PaymentPlansState = {
  plans: PaymentPlan[]
  loading: boolean
  error: string | null
  plusMonthlyUsd: number | null
  plusMonthlyDisplay: string | null
  priceForBilling: (billing: BillingCycle) => number | null
  displayForBilling: (billing: BillingCycle) => string | null
}

let cachedPlans: PaymentPlan[] | null = null
let inflight: Promise<PaymentPlan[]> | null = null

async function loadPlans(): Promise<PaymentPlan[]> {
  if (cachedPlans) return cachedPlans
  if (!inflight) {
    inflight = fetchPaymentPlans()
      .then((plans) => {
        cachedPlans = plans
        return plans
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function usePaymentPlans(): PaymentPlansState {
  const [plans, setPlans] = React.useState<PaymentPlan[]>(
    () => cachedPlans ?? []
  )
  const [loading, setLoading] = React.useState(() => !cachedPlans)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (cachedPlans) {
      return
    }

    let cancelled = false
    void loadPlans()
      .then((next) => {
        if (cancelled) return
        setPlans(next)
        setError(null)
        setLoading(false)
      })
      .catch((caught) => {
        if (cancelled) return
        setError(
          caught instanceof Error ? caught.message : "Could not load plans"
        )
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function priceForBilling(billing: BillingCycle) {
    return plusPriceUsdFromPlans(plans, billing)
  }

  function displayForBilling(billing: BillingCycle) {
    return formatPlanPriceUsd(plusPriceUsdFromPlans(plans, billing))
  }

  const plusMonthlyUsd = plusPriceUsdFromPlans(plans, "monthly")

  return {
    plans,
    loading,
    error,
    plusMonthlyUsd,
    plusMonthlyDisplay: formatPlanPriceUsd(plusMonthlyUsd),
    priceForBilling,
    displayForBilling,
  }
}
