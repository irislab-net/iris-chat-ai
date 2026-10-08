/**
 * CFG2 — namespaced staking canonical config (additive). Deployment secrets remain env-backed via `@/config/env`.
 */
import * as eth from "@/staking/config/stakingEthConfig"
import * as featureFlags from "@/staking/config/stakingFeatureFlags"
import * as tron from "@/staking/config/stakingTronConfig"
import * as ui from "@/staking/config/stakingUiConfig"

export const stakingConfig = Object.freeze({
  eth,
  tron,
  ui,
  featureFlags,
})
