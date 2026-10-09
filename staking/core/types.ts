/**
 * Deployment registry types for staking. Phase 1: EVM legacy only; no runtime wiring yet.
 * Phase 12: `DeploymentProviderRuntimeKey` — future multi-deployment provider map identity (pure).
 * Phase 13: explicit `CHAIN_FAMILIES`, CAIP-2 as authoritative network id, validation result types.
 *
 * ## Multi-family constraints (foundation)
 *
 * - **Numeric `chainId` alone is insufficient** for runtime identity: it overloads across families
 *   (EVM vs others) and omits namespace — **CAIP-2** (`namespace:reference`) is the portable network id.
 * - **`chainFamily`** selects codec, provider stack, and explorer semantics — not derivable from
 *   `chainId` alone once Tron (or other families) exist.
 * - **`DeploymentProviderRuntimeKey`** must include **`chainFamily`** plus **CAIP-2** so two
 *   deployments cannot collide when ids or numeric references overlap across families.
 *
 * **Phase 15:** `DeploymentValidationSeverity`, `normalizeDeployment`, registry validation (soft-fail
 * at load — production does not crash on malformed optional rows; legacy Ethereum row remains).
 *
 * **Phase 16:** optional passive deployments may appear in `deployments[]` from
 * `VITE_STAKING_DEPLOYMENTS_JSON` — **not** executable until a future activation phase.
 *
 * **Phase 46:** optional **explicit** Tron row from `VITE_STAKING_TRON_*` (see `buildExplicitEnvDeploymentRows.ts`)
 * is merged after legacy and before JSON; same dedupe rules. Ethereum is legacy-primary (+ JSON) only (CFG7b).
 * Still **not** shared liquidity / cross-chain execution — each row is isolated.
 */

/** Known staking chain families (runtime registry will grow here first). */
export const CHAIN_FAMILIES = ["evm", "tron"] as const

export type ChainFamily = (typeof CHAIN_FAMILIES)[number]

export type DeploymentId = string

export const LEGACY_PRIMARY_DEPLOYMENT_ID: DeploymentId = "legacy-primary"

/** Phase 46 — optional Tron row from explicit `VITE_STAKING_TRON_*` env block (passive today). */
export const EXPLICIT_ENV_TRON_DEPLOYMENT_ID: DeploymentId = "env-explicit-tron"

/**
 * Stable string identity for a deployment’s read RPC surface (HTTP/WS pair + chain), **not** yet
 * attached to live `JsonRpcProvider` instances. Intended for future multi-deployment provider maps.
 *
 * @example `legacy-primary:evm:eip155:1`
 */
export type DeploymentProviderRuntimeKey = string & {
  readonly __brand: "DeploymentProviderRuntimeKey"
}

export type DeploymentValidationSeverity = "warning" | "error"

/** Single issue from deployment / registry validation (pure). */
export type DeploymentValidationIssue = {
  readonly severity: DeploymentValidationSeverity
  readonly code: string
  readonly message: string
  /** Optional row context when the issue targets one deployment. */
  readonly deploymentId?: string
}

export type DeploymentValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly issues: readonly DeploymentValidationIssue[] }

export type StakingDeploymentConfig = {
  id: DeploymentId
  chainFamily: ChainFamily
  /**
   * Authoritative CAIP-2 network id (e.g. `eip155:1` for EVM, `tron:mainnet` for Tron). Do not infer
   * the network from numeric chain id alone — families use different namespaces / reference shapes.
   */
  caip2: string
  vault: { address: string }
  token: { address: string }
  rpc: { http: string; ws: string | null }
  explorer: { baseUrl: string; label: string }
  /** Human network label (from `VITE_STAKING_NETWORK_LABEL`) */
  labels: { network: string }
}

export type StakingDeploymentRegistry = {
  readonly deployments: readonly StakingDeploymentConfig[]
  readonly defaultDeploymentId: DeploymentId
}
