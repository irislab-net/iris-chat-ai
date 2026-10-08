import type { StakingDeploymentConfig } from "@/staking/core/types"

/** Inline copy shown once near the primary CTA on passive Tron runtime only. */
export const STAKING_PASSIVE_TRON_VIEW_ONLY_MESSAGE =
  "TRON balances and activity are currently view-only."

export function isPassiveTronStakingRuntime(
  deployment: Pick<StakingDeploymentConfig, "chainFamily">
): boolean {
  return deployment.chainFamily === "tron"
}

/** Primary CTA label when TronLink is on the wrong TRON network. */
export function passiveTronWrongNetworkCtaLabel(caip2: string): string {
  const ref = caip2.trim().toLowerCase().split(":")[1] ?? ""
  if (ref === "nile") return "Switch to Nile"
  if (ref === "mainnet") return "Switch to Mainnet"
  if (ref === "shasta") return "Switch to Shasta"
  return "Switch Network"
}

/** Navbar chip when connected on TRON but wrong network. */
export function passiveTronWrongNetworkNavbarLabel(caip2: string): string {
  return passiveTronWrongNetworkCtaLabel(caip2)
}
