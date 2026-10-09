/**
 * CFG6 — when **no** deployment rows survive rollout filtering, the app still needs a typed
 * `StakingDeploymentConfig` for `ActiveRuntimeSelection`. This sentinel is **never** in the registry;
 * capabilities map to `UNKNOWN_FAMILY` and hydration gates treat it as non-operational.
 */
import { resolveStakingDeploymentForReconcile } from "@/staking/core/getStakingDeploymentRegistry"
import type {
  StakingDeploymentConfig,
  StakingDeploymentRegistry,
} from "@/staking/core/types"

export const CFG6_STAKING_RUNTIME_DISABLED_DEPLOYMENT_ID =
  "cfg6-runtime-disabled" as const

export function isCfg6StakingRuntimeDisabledSentinel(
  deployment: StakingDeploymentConfig
): boolean {
  return deployment.id.trim() === CFG6_STAKING_RUNTIME_DISABLED_DEPLOYMENT_ID
}

/** Minimal valid EVM-shaped row; RPC URL is inert — provider stack must never hydrate off it. */
export function buildCfg6StakingRuntimeDisabledSentinelDeployment(): StakingDeploymentConfig {
  return {
    id: CFG6_STAKING_RUNTIME_DISABLED_DEPLOYMENT_ID,
    chainFamily: "evm",
    caip2: "eip155:0",
    vault: { address: "0x0000000000000000000000000000000000000001" },
    token: { address: "0x0000000000000000000000000000000000000002" },
    rpc: { http: "http://127.0.0.1:0", ws: null },
    explorer: { baseUrl: "https://invalid.local", label: "disabled" },
    labels: { network: "disabled" },
  }
}

export function resolveStakingDeploymentForActiveSelection(
  registry: StakingDeploymentRegistry
): StakingDeploymentConfig {
  if (registry.deployments.length === 0) {
    return buildCfg6StakingRuntimeDisabledSentinelDeployment()
  }
  return resolveStakingDeploymentForReconcile(registry, registry.defaultDeploymentId)
}
