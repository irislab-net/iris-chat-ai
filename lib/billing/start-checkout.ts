import type { PaymentInvoice, PaymentCurrency } from "@/lib/billing/invoice-types"
import { startPlusCryptoCheckout } from "@/lib/billing/invoices"
import type { BillingCycle } from "@/lib/billing/catalog"

export async function startPlusCheckout(input: {
  billing: BillingCycle
  couponCode?: string
  currency: PaymentCurrency
}): Promise<PaymentInvoice> {
  return startPlusCryptoCheckout({
    billing: input.billing,
    couponCode: input.couponCode,
    currency: input.currency,
  })
}
