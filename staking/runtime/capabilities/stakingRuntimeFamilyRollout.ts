/**
 * CFG6 — env-backed **family** rollout flags only (no registry imports; safe for `getStakingDeploymentRegistry`).
 */
import { isStakingEthereumEnabled, isStakingTronEnabled } from "@/config/env"
import type { ChainFamily } from "@/staking/core/types"

export function isRuntimeFamilyEnabled(family: ChainFamily): boolean {
  if (family === "evm") return isStakingEthereumEnabled()
  return isStakingTronEnabled()
}

export function getEnabledRuntimeFamilies(): readonly ChainFamily[] {
  const out: ChainFamily[] = []
  if (isStakingEthereumEnabled()) out.push("evm")
  if (isStakingTronEnabled()) out.push("tron")
  return out
}
