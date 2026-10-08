import { isEvmDeployment } from "@/staking/core/deploymentFamily"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import { LEGACY_PRIMARY_DEPLOYMENT_ID } from "@/staking/core/types"
import { isCfg6StakingRuntimeDisabledSentinel } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"

/**
 * Phase 22 — **explicit runtime capability model** (pure).
 *
 * **Runtime availability ≠ feature parity:** a row may have HTTP + receipts while **gas**, **allowance**,
 * **ethers Contract reads**, or **staking execution** remain unsupported for that policy / family.
 *
 * **Phase 23:** App hooks should prefer **`getActiveStakingRuntimeSelection()`** / **`useActiveRuntimeSelection`**
 * for passive deployment identity instead of ad-hoc `resolveLegacyStakingDeployment()` at call sites.
 *
 * **Invariant:** no module may infer “runtime exists” ⇒ “supports staking execution”. **Phase 35:**
 * **`evaluateRuntimeSwapPolicy`** uses **`supportsPassiveReads`** / **`supportsStakingExecution`** /
 * **`isDeploymentRuntimeExecutable`** explicitly — passive-readable vs execution-capable are not conflated.
 */
export type RuntimeCapabilities = Readonly<{
  supportsEthersContracts: boolean
  supportsGasEstimation: boolean
  supportsAllowance: boolean
  supportsReceiptPolling: boolean
  supportsStakingExecution: boolean
  supportsPassiveReads: boolean
}>

const ALL_TRUE: RuntimeCapabilities = {
  supportsEthersContracts: true,
  supportsGasEstimation: true,
  supportsAllowance: true,
  supportsReceiptPolling: true,
  supportsStakingExecution: true,
  supportsPassiveReads: true,
}

const PASSIVE_TRON: RuntimeCapabilities = {
  supportsEthersContracts: false,
  supportsGasEstimation: false,
  supportsAllowance: false,
  supportsReceiptPolling: true,
  supportsStakingExecution: false,
  supportsPassiveReads: true,
}

const PASSIVE_EVM: RuntimeCapabilities = {
  supportsEthersContracts: true,
  supportsGasEstimation: false,
  supportsAllowance: false,
  supportsReceiptPolling: true,
  supportsStakingExecution: false,
  supportsPassiveReads: true,
}

const UNKNOWN_FAMILY: RuntimeCapabilities = {
  supportsEthersContracts: false,
  supportsGasEstimation: false,
  supportsAllowance: false,
  supportsReceiptPolling: false,
  supportsStakingExecution: false,
  supportsPassiveReads: false,
}

/** Legacy-primary EVM deployment only — registry validity ≠ runtime executability (Phase 18+). */
export function isDeploymentRuntimeExecutable(deployment: StakingDeploymentConfig): boolean {
  if (isCfg6StakingRuntimeDisabledSentinel(deployment)) return false
  return (
    deployment.id.trim() === LEGACY_PRIMARY_DEPLOYMENT_ID.trim() && isEvmDeployment(deployment)
  )
}

export function assertExecutableDeployment(deployment: StakingDeploymentConfig): void {
  if (!isDeploymentRuntimeExecutable(deployment)) {
    throw new Error(
      `[staking] Deployment is not runtime-executable: id=${deployment.id} chainFamily=${deployment.chainFamily}. ` +
        "Registry validity ≠ runtime executability. Passive / non-legacy runtimes do not imply execution (Phase 22)."
    )
  }
}

export function getRuntimeCapabilitiesForDeployment(
  deployment: StakingDeploymentConfig
): RuntimeCapabilities {
  if (isCfg6StakingRuntimeDisabledSentinel(deployment)) {
    return UNKNOWN_FAMILY
  }
  if (deployment.chainFamily === "tron") {
    return PASSIVE_TRON
  }
  if (deployment.chainFamily === "evm") {
    return isDeploymentRuntimeExecutable(deployment) ? ALL_TRUE : PASSIVE_EVM
  }
  return UNKNOWN_FAMILY
}

/** Phase 40 — DEV panel: short comma list of enabled capability flags. */
export function summarizeRuntimeCapabilitiesForDev(caps: RuntimeCapabilities): string {
  const parts: string[] = []
  if (caps.supportsPassiveReads) parts.push("passiveReads")
  if (caps.supportsEthersContracts) parts.push("ethersContracts")
  if (caps.supportsGasEstimation) parts.push("gas")
  if (caps.supportsAllowance) parts.push("allowance")
  if (caps.supportsReceiptPolling) parts.push("receipts")
  if (caps.supportsStakingExecution) parts.push("stakingExecution")
  return parts.length > 0 ? parts.join(", ") : "(none)"
}

export function assertSupportsEthersContracts(deployment: StakingDeploymentConfig): void {
  if (!getRuntimeCapabilitiesForDeployment(deployment).supportsEthersContracts) {
    throw new Error(
      `[staking] Runtime does not support ethers Contract reads (id=${deployment.id} chainFamily=${deployment.chainFamily}) [Phase 22]`
    )
  }
}

export function assertSupportsGasEstimation(deployment: StakingDeploymentConfig): void {
  if (!getRuntimeCapabilitiesForDeployment(deployment).supportsGasEstimation) {
    throw new Error(
      `[staking] Runtime does not support EVM gas estimation (id=${deployment.id} chainFamily=${deployment.chainFamily}) [Phase 22]`
    )
  }
}

/**
 * Phase 30 — **drift audit** (non-exhaustive; enforcement lives in `runtimeExecutionTarget` + vault/gas hooks):
 *
 * - **Wallet chain drift:** wallet numeric `chainId` can disagree with deployment CAIP-2 until user switches;
 *   execution target checks do not replace wallet network checks.
 * - **Signer / runtime mismatch:** `Signer` is wallet-bound; `deriveRuntimeExecutionTarget` is passive-registry-bound —
 *   both must agree before txs (Phase 30 `expectedExecutionTarget` on modal flows).
 * - **Gas / runtime mismatch:** `useStakingGasEstimate` refuses RPC estimates when frozen target ≠ active passive row.
 * - **Explorer / runtime mismatch:** receipt success URLs use frozen CAIP-2 (`TransactionStatusProvider`); passive drift
 *   blocks terminal commit when targets diverge.
 * - **Pending tx after runtime switch:** without mutable switching this is mostly theoretical; when introduced,
 *   inflight hashes must stay bound to frozen `executionTarget` and refuse active-runtime remaps.
 *
 * **Phase 31–34:** refresh orchestration consults **`canRuntimeOperationRefresh`** / **`canRuntimeOperationCommit`**
 * when the staking session carries a coordinator snapshot (`stakingRefreshOrchestrator.ts`); coordinator
 * **`lifecycle`** / **`sequenceStage`** / **`transitionGeneration`** derive from **`runtimeTransitionController`**
 * + **`runtimeTransitionSequence`** (React provider). Internal swaps (**`executeRuntimeSwap`**) bump both
 * generations so stale work fails commit gates before refresh resumes.
 */