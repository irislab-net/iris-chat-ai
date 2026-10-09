import type { ChainFamily } from "@/staking/core/types"

/** Public-folder chain badges (EVM / Tron) for token avatar overlays. */
const STAKING_CHAIN_BADGE_SRC: Record<ChainFamily, string> = {
  evm: "/images/ethereum-logo.png",
  tron: "/images/tron-logo.png",
}

export function resolveStakingChainBadgeUrl(family: ChainFamily): string {
  return STAKING_CHAIN_BADGE_SRC[family]
}
