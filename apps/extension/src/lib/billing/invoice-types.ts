import type { BillingCycle } from "@/lib/billing/catalog"

export const PAYMENT_CURRENCIES = ["USDT", "USDC"] as const

export type PaymentCurrency = (typeof PAYMENT_CURRENCIES)[number]

export function isPaymentCurrency(value: string): value is PaymentCurrency {
  return PAYMENT_CURRENCIES.includes(value as PaymentCurrency)
}

export type InvoiceStatus = "pending" | "paid" | "failed" | "expired"

export type PaymentInvoice = {
  uid: string
  user_id: string
  plan_id: string
  original_amount_usd: number
  amount_usd: number
  amount_crypto: string
  currency: PaymentCurrency | string
  coupon_code?: string | null
  tier: string
  duration_days: number
  pay_address: string
  status: InvoiceStatus | string
  paid_at?: string | null
  paid_amount_crypto?: string | null
  expires_at: string
  is_swept: boolean
  sweep_tx_hash?: string | null
  swept_at?: string | null
  created_at: string
  updated_at: string
}

export type CreateInvoiceBody = {
  plan_id: string
  currency: PaymentCurrency
  coupon_code?: string
}

export type StartPlusCheckoutInput = {
  billing: BillingCycle
  couponCode?: string
  currency?: PaymentCurrency
}
