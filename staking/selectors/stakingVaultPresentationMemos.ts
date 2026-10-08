// Phase D2a extracted presentation selectors

import { STAKING_DEFAULT_STABLECOIN_LABEL } from "@/staking/config"

export function selectTokenLabel(tokenSymbol: string, tokenName: string): string {
  return tokenSymbol || tokenName || "Token"
}

export function selectMerchantTokenSymbol(tokenSymbol: string): string {
  return tokenSymbol ? `M${tokenSymbol}` : ""
}

export type SelectMerchantTokenSymbolForTxHistoryInput = Readonly<{
  merchantTokenSymbol: string
  tokenSymbol: string
}>

export function selectMerchantTokenSymbolForTxHistory(
  input: SelectMerchantTokenSymbolForTxHistoryInput
): string {
  return input.merchantTokenSymbol || `M${input.tokenSymbol || STAKING_DEFAULT_STABLECOIN_LABEL}`
}

export function selectMerchantTokenName(tokenName: string): string {
  return tokenName ? `${tokenName} Merchant` : ""
}
