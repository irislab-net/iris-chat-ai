import type { PaymentCurrency } from "@/lib/billing/invoice-types"

export const PAYMENT_NETWORK_ID = "ethereum"

export type PaymentNetworkOption = {
  id: typeof PAYMENT_NETWORK_ID
  name: string
  shortName: string
}

export type PaymentTokenOption = {
  id: PaymentCurrency
  name: string
}

export const PAYMENT_NETWORK: PaymentNetworkOption = {
  id: PAYMENT_NETWORK_ID,
  name: "Ethereum",
  shortName: "ETH",
}

export const PAYMENT_TOKENS: PaymentTokenOption[] = [
  {
    id: "USDT",
    name: "Tether USD",
  },
  {
    id: "USDC",
    name: "USD Coin",
  },
]
