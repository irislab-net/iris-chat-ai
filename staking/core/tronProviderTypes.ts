import type { DeploymentProviderRuntimeKey } from "@/staking/core/types"

/**
 * Phase 21 — **passive Tron HTTP runtime** (no TronWeb, no globals).
 *
 * **Runtime available ≠ staking executable:** this handle exists for receipt probes and future
 * read/indexing work only; `isDeploymentRuntimeExecutable` still rejects Tron for execution policy.
 */
export type TronHttpProvider = {
  readonly kind: "tron-http"
  readonly runtimeKey: DeploymentProviderRuntimeKey
  readonly rpcHttpUrl: string
  /** POST JSON to a Tron FullNode `wallet/*` path (leading slash optional). */
  postWalletJson<T = unknown>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T>
}
