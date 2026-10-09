import { isStakingEthereumEnabled, isStakingTronEnabled } from "@/config/env"
import {
  getRuntimeCapabilitiesForDeployment,
  isDeploymentRuntimeExecutable,
} from "@/staking/core/runtimeCapabilities"
import {
  LEGACY_PRIMARY_DEPLOYMENT_ID,
  type ChainFamily,
  type StakingDeploymentRegistry,
} from "@/staking/core/types"

/**
 * Phase 46 — product-facing view of registry rows (no merged balances; labels + capability flags only).
 */
export type StakingProductNetworkChoice = Readonly<{
  deploymentId: string
  networkLabel: string
  chainFamily: string
  /** True only when staking execution is allowed on this row (today: legacy-primary EVM). */
  canExecuteStakingHere: boolean
}>

export function listStakingProductNetworkChoices(
  registry: StakingDeploymentRegistry
): StakingProductNetworkChoice[] {
  return registry.deployments.map(d => ({
    deploymentId: d.id,
    networkLabel: d.labels.network,
    chainFamily: d.chainFamily,
    canExecuteStakingHere: isDeploymentRuntimeExecutable(d),
  }))
}

export function chainFamilyOrEvm(family: string): ChainFamily {
  return family === "tron" ? "tron" : "evm"
}

/**
 * One picker row per chain family — legacy-primary preferred for EVM when present (matches balance chip).
 */
export function dedupeStakingProductNetworkChoicesByChain(
  choices: readonly StakingProductNetworkChoice[]
): StakingProductNetworkChoice[] {
  const legacyId = LEGACY_PRIMARY_DEPLOYMENT_ID.trim()
  let evm: StakingProductNetworkChoice | undefined
  let tron: StakingProductNetworkChoice | undefined
  for (const c of choices) {
    const fam = chainFamilyOrEvm(c.chainFamily)
    if (fam === "tron") {
      tron ??= c
      continue
    }
    const isLegacy = c.deploymentId.trim() === legacyId
    if (!evm) {
      evm = c
    } else if (isLegacy && evm.deploymentId.trim() !== legacyId) {
      evm = c
    }
  }
  const out: StakingProductNetworkChoice[] = []
  if (evm) out.push(evm)
  if (tron) out.push(tron)
  return out
}

/** Radix `Select` values for rollout-disabled / missing-deployment slots — never real deployment ids. */
export const STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER =
  "__staking_network_ph:evm" as const
export const STAKING_NETWORK_SELECTOR_VALUE_TRON_PLACEHOLDER =
  "__staking_network_ph:tron" as const

export type StakingProductNetworkSelectorRow =
  | Readonly<{ kind: "deployment"; choice: StakingProductNetworkChoice }>
  | Readonly<{
      kind: "placeholder"
      chainFamily: ChainFamily
      /** When the family is off via `VITE_ENABLE_*`, UI shows a subtle "Soon" badge. */
      rolloutDisabled: boolean
    }>

/**
 * **Presentation-only:** always **two** rows (Ethereum, then Tron) for stable selector chrome.
 * Placeholders do not exist in the deployment registry and must never drive runtime swaps.
 */
export function buildStakingProductNetworkSelectorRows(
  registry: StakingDeploymentRegistry
): StakingProductNetworkSelectorRow[] {
  const evmRollout = isStakingEthereumEnabled()
  const tronRollout = isStakingTronEnabled()
  const pickerChoices = dedupeStakingProductNetworkChoicesByChain(
    listStakingProductNetworkChoices(registry)
  )
  const evmChoice = pickerChoices.find(c => chainFamilyOrEvm(c.chainFamily) === "evm")
  const tronChoice = pickerChoices.find(c => chainFamilyOrEvm(c.chainFamily) === "tron")
  const rows: StakingProductNetworkSelectorRow[] = []
  if (evmChoice) {
    rows.push({ kind: "deployment", choice: evmChoice })
  } else {
    rows.push({
      kind: "placeholder",
      chainFamily: "evm",
      rolloutDisabled: !evmRollout,
    })
  }
  if (tronChoice) {
    rows.push({ kind: "deployment", choice: tronChoice })
  } else {
    rows.push({
      kind: "placeholder",
      chainFamily: "tron",
      rolloutDisabled: !tronRollout,
    })
  }
  return rows
}

export function stakingProductNetworkSelectorItemValue(
  row: StakingProductNetworkSelectorRow
): string {
  if (row.kind === "deployment") return row.choice.deploymentId.trim()
  return row.chainFamily === "tron"
    ? STAKING_NETWORK_SELECTOR_VALUE_TRON_PLACEHOLDER
    : STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER
}

export function countStakingProductNetworkSelectorDeploymentRows(
  rows: readonly StakingProductNetworkSelectorRow[]
): number {
  return rows.filter(r => r.kind === "deployment").length
}

/**
 * Default passive selection remains **`legacy-primary`** until product UI wires an explicit picker.
 * Callers may later choose another row only when wallet + capabilities allow (still one active row).
 */
export function resolveStakingProductDefaultDeploymentId(
  registry: StakingDeploymentRegistry
): string {
  if (registry.deployments.length === 0) return ""
  const preferred = LEGACY_PRIMARY_DEPLOYMENT_ID.trim()
  if (registry.deployments.some(d => d.id.trim() === preferred)) return preferred
  return registry.defaultDeploymentId.trim()
}

/** Plain-language hint when a row is visible but not executable with the current wallet stack. */
export function stakingProductUnsupportedExecutionHint(
  deploymentId: string,
  chainFamily: string
): string | null {
  if (deploymentId.trim() === LEGACY_PRIMARY_DEPLOYMENT_ID.trim()) return null
  if (chainFamily === "tron") {
    return "This row is a separate Tron vault. On-chain staking actions in this app run on the primary Ethereum vault only; use an Ethereum-compatible wallet on the supported chain."
  }
  if (chainFamily === "evm") {
    return "This Ethereum deployment is passive in this build. Deposit and withdraw use the primary vault; connect on the supported Ethereum network when prompted."
  }
  return "This deployment is not the active staking executor in this build; use the primary vault and a compatible wallet."
}

export function stakingProductCapabilitiesForDeploymentId(
  registry: StakingDeploymentRegistry,
  deploymentId: string
) {
  const d = registry.deployments.find(x => x.id.trim() === deploymentId.trim())
  return d ? getRuntimeCapabilitiesForDeployment(d) : null
}
