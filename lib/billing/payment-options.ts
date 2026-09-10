import { MARKET_ASSET_LOGOS } from "@/lib/market-asset-logo"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"

export const PAYMENT_NETWORK_ID = "ethereum"

export type PaymentNetworkOption = {
  id: typeof PAYMENT_NETWORK_ID
  name: string
  shortName: string
  logoSrc: string
}

export type PaymentTokenOption = {
  id: PaymentCurrency
  name: string
  logoSrc: string
}

export const PAYMENT_NETWORK: PaymentNetworkOption = {
  id: PAYMENT_NETWORK_ID,
  name: "Ethereum",
  shortName: "ETH",
  logoSrc: MARKET_ASSET_LOGOS.ETH,
}

export const PAYMENT_TOKENS: PaymentTokenOption[] = [
  {
    id: "USDT",
    name: "Tether USD",
    logoSrc:
      "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  },
  {
    id: "USDC",
    name: "USD Coin",
    logoSrc:
      "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  },
]
