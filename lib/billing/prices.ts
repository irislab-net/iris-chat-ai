/**
 * Env helpers for analytics fallbacks + USD formatting.
 * UI plan prices load from GET /v1/payments/plans (`lib/billing/plans.ts`).
 *
 * Values may be a bare number (`19`), a `$` amount (`$19`), or a label
 * (`Free`, `Custom`).
 */
export const PRICE_ENV = {
  free: "NEXT_PUBLIC_PRICE_FREE",
  plusMonthly: "NEXT_PUBLIC_PRICE_PLUS_MONTHLY",
  plusCompareAt: "NEXT_PUBLIC_PRICE_PLUS_COMPARE_AT",
  plusAnnualMonthly: "NEXT_PUBLIC_PRICE_PLUS_ANNUAL_MONTHLY",
  ultimate: "NEXT_PUBLIC_PRICE_ULTIMATE",
} as const

const DEFAULTS = {
  free: "0",
  plusMonthly: "19",
  plusCompareAt: "49",
  plusAnnualMonthly: "41",
  ultimate: "Custom",
} as const

type EnvMap = Record<string, string | undefined>

function readRaw(env: EnvMap, key: string, fallback: string): string {
  const value = env[key]?.trim()
  return value || fallback
}

/** Parse `$19` / `19` / `19.5` → number; labels → null. */
export function parsePriceAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/^\$/, "").replace(/,/g, "")
  if (!cleaned || /[a-zA-Z]/.test(cleaned)) return null
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? amount : null
}

export function formatUsd(amount: number): string {
  if (Number.isInteger(amount)) return `$${amount}`
  return `$${amount.toFixed(2)}`
}

function toDisplay(raw: string): string {
  const amount = parsePriceAmount(raw)
  if (amount === null) return raw.trim()
  return formatUsd(amount)
}

export type PlanPrices = {
  free: { display: string; amount: number | null }
  plus: {
    monthly: { display: string; amount: number | null }
    compareAt: { display: string; amount: number | null }
    annualMonthly: { display: string; amount: number | null }
    showCompareAt: boolean
  }
  ultimate: { display: string }
  cadence: string
}

export function resolvePlanPrices(env: EnvMap = process.env): PlanPrices {
  const freeRaw = readRaw(env, PRICE_ENV.free, DEFAULTS.free)
  const plusMonthlyRaw = readRaw(
    env,
    PRICE_ENV.plusMonthly,
    DEFAULTS.plusMonthly
  )
  const plusCompareRaw = readRaw(
    env,
    PRICE_ENV.plusCompareAt,
    DEFAULTS.plusCompareAt
  )
  const plusAnnualRaw = readRaw(
    env,
    PRICE_ENV.plusAnnualMonthly,
    DEFAULTS.plusAnnualMonthly
  )
  const ultimateRaw = readRaw(env, PRICE_ENV.ultimate, DEFAULTS.ultimate)

  const monthlyAmount = parsePriceAmount(plusMonthlyRaw)
  const compareAmount = parsePriceAmount(plusCompareRaw)
  const showCompareAt =
    compareAmount !== null &&
    monthlyAmount !== null &&
    compareAmount > monthlyAmount

  return {
    free: {
      display: toDisplay(freeRaw),
      amount: parsePriceAmount(freeRaw),
    },
    plus: {
      monthly: {
        display: toDisplay(plusMonthlyRaw),
        amount: monthlyAmount,
      },
      compareAt: {
        display: toDisplay(plusCompareRaw),
        amount: compareAmount,
      },
      annualMonthly: {
        display: toDisplay(plusAnnualRaw),
        amount: parsePriceAmount(plusAnnualRaw),
      },
      showCompareAt,
    },
    ultimate: { display: toDisplay(ultimateRaw) },
    cadence: "/ month",
  }
}

export function getBillingDisplayPrices(env: EnvMap = process.env) {
  const prices = resolvePlanPrices(env)
  return {
    monthly: {
      free: prices.free.display,
      plus: prices.plus.monthly.display,
      ultimate: prices.ultimate.display,
      cadence: prices.cadence,
    },
    annual: {
      free: prices.free.display,
      plus: prices.plus.annualMonthly.display,
      ultimate: prices.ultimate.display,
      cadence: prices.cadence,
    },
  } as const
}

export function getLandingPlanPrice(
  planKey: "free" | "plus" | "ultimate",
  env: EnvMap = process.env
): { price: string; priceWas: string | null } {
  const prices = resolvePlanPrices(env)
  if (planKey === "free") {
    return { price: prices.free.display, priceWas: null }
  }
  if (planKey === "ultimate") {
    return { price: prices.ultimate.display, priceWas: null }
  }
  return {
    price: prices.plus.monthly.display,
    priceWas: prices.plus.showCompareAt
      ? prices.plus.compareAt.display
      : null,
  }
}

/** USD totals for analytics (monthly charge / annual charge). */
export function getPlusUsdValue(
  billing: "monthly" | "annual",
  env: EnvMap = process.env
): number {
  const prices = resolvePlanPrices(env)
  if (billing === "annual") {
    const perMonth = prices.plus.annualMonthly.amount
    if (perMonth !== null) return perMonth * 12
    return (prices.plus.monthly.amount ?? 0) * 12
  }
  return prices.plus.monthly.amount ?? 0
}
