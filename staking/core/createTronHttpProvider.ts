import {
  diagnosticsKey,
  hostnameFromUrl,
  normalizeNetworkError,
  recordEndpointFailure,
} from "@/lib/networkErrors"
import type { TronHttpProvider } from "@/staking/core/tronProviderTypes"
import type { DeploymentProviderRuntimeKey } from "@/staking/core/types"

/**
 * Pure construction of a passive Tron FullNode HTTP client (Phase 21).
 * No TronWeb, no module-level singleton — registry owns instance lifetime.
 */
export function createTronHttpProvider(params: {
  runtimeKey: DeploymentProviderRuntimeKey
  rpcHttpUrl: string
}): TronHttpProvider {
  const base = params.rpcHttpUrl.trim().replace(/\/+$/, "")
  const runtimeKey = params.runtimeKey
  return {
    kind: "tron-http",
    runtimeKey,
    rpcHttpUrl: base,
    async postWalletJson<T = unknown>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
      const p = path.startsWith("/") ? path : `/${path}`
      const url = `${base}${p}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      })
      if (!res.ok) {
        const err = new Error(`[staking] Tron HTTP ${res.status} ${res.statusText} (${p})`)
        const normalized = normalizeNetworkError(err, {
          endpointType: "rpc",
          transport: "http",
          url: base,
          requestMethod: p,
          severity: "silent",
          httpStatus: res.status,
        })
        recordEndpointFailure(
          diagnosticsKey({
            endpointType: "rpc",
            transport: "http",
            hostname: hostnameFromUrl(base),
          }),
          normalized
        )
        throw err
      }
      return (await res.json()) as T
    },
  }
}
