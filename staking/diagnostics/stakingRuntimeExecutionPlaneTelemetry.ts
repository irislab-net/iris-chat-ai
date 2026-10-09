import { stakingDevConsoleDebug } from "@/staking/diagnostics/stakingDevConsole"
import type { ChainFamily } from "@/staking/core/types"

export type RuntimeExecutionPlaneTelemetryReason =
  | "runtime_swap"
  | "wallet_connect"
  | "wallet_disconnect"
  | "network_change"

export type RuntimeExecutionPlaneSnapshot = Readonly<{
  reason: RuntimeExecutionPlaneTelemetryReason
  runtimeKey: string
  chainFamily: ChainFamily
  runtimeWalletConnected: boolean
  executionConnected: boolean
  executionChainId: number | null
  executionNetworkOk: boolean
  runtimeWalletAddress: string | null
  executionAddress: string | null
  canTransact: boolean
  supportsStakingExecution: boolean
}>

const PREFIX = "[staking-vault][runtime-execution-plane]"

/**
 * DEV-only migration telemetry for runtime (UI) vs execution (`eip155`) planes.
 * Emitted on runtime swap, wallet connect/disconnect, and network changes only.
 */
export function logRuntimeExecutionPlaneSnapshot(
  snapshot: RuntimeExecutionPlaneSnapshot
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  stakingDevConsoleDebug(PREFIX, snapshot)
}

export type RuntimeExecutionPlaneTelemetryCursor = Readonly<{
  runtimeKey: string
  generation: number
  runtimeWalletConnected: boolean
  executionConnected: boolean
  executionChainId: number | null
  runtimeWalletNetworkOk: boolean
  isWrongNetwork: boolean
}>

export function detectRuntimeExecutionPlaneTelemetryReason(
  prev: RuntimeExecutionPlaneTelemetryCursor,
  cur: RuntimeExecutionPlaneTelemetryCursor
): RuntimeExecutionPlaneTelemetryReason | null {
  if (
    prev.runtimeKey !== cur.runtimeKey ||
    prev.generation !== cur.generation
  ) {
    return "runtime_swap"
  }

  const prevWallet =
    prev.runtimeWalletConnected || prev.executionConnected
  const curWallet = cur.runtimeWalletConnected || cur.executionConnected
  if (prevWallet !== curWallet) {
    return curWallet ? "wallet_connect" : "wallet_disconnect"
  }

  if (
    prev.executionChainId !== cur.executionChainId ||
    prev.runtimeWalletNetworkOk !== cur.runtimeWalletNetworkOk ||
    prev.isWrongNetwork !== cur.isWrongNetwork
  ) {
    return "network_change"
  }

  return null
}
